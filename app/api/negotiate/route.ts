import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "next-sanity";
import { randomUUID } from "crypto";

// ── Sanity clients ────────────────────────────────────────────────────────
const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
});

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ── Rate limiting ─────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

// Alert fires when bid is within this % ABOVE floor (e.g. 0.15 = 15% above)
const CLOSE_TO_FLOOR_THRESHOLD = 0.15;
// Alert also fires when bid is within this % BELOW floor (catches "670k vs 685k floor" cases)
const BELOW_FLOOR_THRESHOLD = 0.20;

// ── Persist session to Sanity ─────────────────────────────────────────────
async function upsertSession({
  sessionId,
  product,
  customerMessage,
  aiReply,
  closeBidAlert,
  customerBid,
  dealAgreedPrice,
}: {
  sessionId: string;
  product: { _id?: string; name: string; price: number; floorPrice: number; slug?: string };
  customerMessage: string;
  aiReply: string;
  closeBidAlert: boolean;
  customerBid?: number;
  dealAgreedPrice?: number;
}) {
  try {
    const existing = await writeClient.fetch<{ _id: string } | null>(
      `*[_type == "negotiationSession" && sessionId == $sessionId][0]{ _id }`,
      { sessionId }
    );

    const now = new Date().toISOString();
    const customerMsg = {
      _key: `c_${Date.now()}`,
      role: "user",
      content: customerMessage,
      sender: "customer",
      timestamp: now,
    };
    const aiMsg = {
      _key: `a_${Date.now() + 1}`,
      role: "assistant",
      content: aiReply,
      sender: "ai",
      timestamp: now,
    };

    if (existing) {
      const patch = writeClient.patch(existing._id)
        .setIfMissing({ messages: [] })
        .append("messages", [customerMsg, aiMsg])
        .set({ lastActivityAt: now });

      if (closeBidAlert) {
        patch.set({ closeBidAlert: true, customerBid });
      }
      if (dealAgreedPrice) {
        patch.set({ status: "deal_struck", agreedPrice: dealAgreedPrice });
      }

      await patch.commit();
    } else {
      await writeClient.create({
        _type: "negotiationSession",
        sessionId,
        productName: product.name,
        productSlug: product.slug ?? "",
        listedPrice: product.price,
        floorPrice: product.floorPrice,
        status: dealAgreedPrice ? "deal_struck" : "ai_active",
        closeBidAlert,
        ...(customerBid && { customerBid }),
        ...(dealAgreedPrice && { agreedPrice: dealAgreedPrice }),
        messages: [customerMsg, aiMsg],
        startedAt: now,
        lastActivityAt: now,
      });
    }
  } catch (err) {
    console.error("[negotiate] Failed to persist session:", err);
  }
}

// ── Owner message polling ─────────────────────────────────────────────────
async function getOwnerMessages(sessionId: string, afterTimestamp: string) {
  try {
    const session = await serverClient.fetch<{
      status: string;
      messages: { role: string; content: string; sender: string; timestamp: string }[];
    } | null>(
      `*[_type == "negotiationSession" && sessionId == $sessionId][0]{
        status,
        messages[]{ role, content, sender, timestamp }
      }`,
      { sessionId }
    );

    if (!session || session.status !== "owner_active") return null;

    const ownerMessages = (session.messages ?? []).filter(
      (m) => m.sender === "owner" && m.timestamp > afterTimestamp
    );

    return ownerMessages.length > 0 ? ownerMessages : null;
  } catch {
    return null;
  }
}

// ── Types ──────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface NegotiateRequest {
  slug: string;
  sessionId?: string;
  messages: Message[];
}

// ── Bid parser ────────────────────────────────────────────────────────────
/**
 * Extracts the highest plausible bid amount from a user message.
 * Handles: "670k", "670K", "₦670k", "₦670,000", "685000", "let's do 670k"
 */
function extractBidAmount(text: string): number | undefined {
  // Match patterns (order matters — k-suffix first to avoid partial matches):
  // 1. Optional ₦, digits+commas, optional decimal, then k/K  e.g. ₦670k, 670K, 670,000k
  // 2. ₦ followed by digits+commas+optional decimal           e.g. ₦685,000
  // 3. Standalone 4–7 digit number not part of a longer number e.g. 685000
  const pattern = /₦?([\d,]+(?:\.\d+)?)[kK]\b|₦([\d,]+(?:\.\d+)?)|(?<!\d)([\d,]{4,7})(?!\d)/g;

  let best: number | undefined;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const raw = (match[1] ?? match[2] ?? match[3]).replace(/,/g, "");
    let amount = parseFloat(raw);
    if (isNaN(amount)) continue;

    // Apply k multiplier only for group 1 (the k-suffix group)
    if (match[1] !== undefined) amount *= 1000;

    // Sanity bounds: must be a plausible naira price (₦10k–₦100M)
    if (amount < 10_000 || amount > 100_000_000) continue;

    // Keep the highest plausible bid found in the message
    if (best === undefined || amount > best) best = amount;
  }

  return best;
}

// ── Route handler ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many messages. Please wait a moment." }, { status: 429 });
  }

  let body: NegotiateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { slug, messages } = body;
  const sessionId = body.sessionId ?? randomUUID();

  if (!slug || !messages || messages.length === 0) {
    return NextResponse.json({ error: "slug and messages are required" }, { status: 400 });
  }
  if (messages.length > 20) {
    return NextResponse.json({ error: "Negotiation session has ended. Please start a new one." }, { status: 400 });
  }

  // ── Fetch product ─────────────────────────────────────────────────────
  const product = await serverClient.fetch<{
    name: string;
    price: number;
    floorPrice: number;
    isNegotiable: boolean;
    negotiationNotes?: string;
    stock: number;
    slug?: string;
  } | null>(
    `*[_type == "product" && slug.current == $slug][0]{
      name, price, floorPrice, isNegotiable, negotiationNotes, stock,
      "slug": slug.current
    }`,
    { slug }
  );

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (!product.isNegotiable) return NextResponse.json({ error: "This product is not open for negotiation" }, { status: 403 });
  if (!product.floorPrice || product.floorPrice <= 0) return NextResponse.json({ error: "Negotiation is temporarily unavailable" }, { status: 503 });
  if (product.stock <= 0) return NextResponse.json({ error: "This product is out of stock" }, { status: 400 });

  // ── Check if owner has taken over ────────────────────────────────────
  const lastMsgTimestamp = new Date(Date.now() - 30000).toISOString();
  const ownerMessages = await getOwnerMessages(sessionId, lastMsgTimestamp);

  if (ownerMessages && ownerMessages.length > 0) {
    const latestOwnerMsg = ownerMessages[ownerMessages.length - 1];
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ text: latestOwnerMsg.content, fromOwner: true })}\n\n`)
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  }

  // ── Detect close-to-floor bid ─────────────────────────────────────────
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  let closeBidAlert = false;
  let detectedBid: number | undefined;

  if (lastUserMessage) {
    const bidAmount = extractBidAmount(lastUserMessage.content);

    if (bidAmount !== undefined) {
      // Fire alert when bid is within BELOW_FLOOR_THRESHOLD below floor
      // OR within CLOSE_TO_FLOOR_THRESHOLD above floor.
      // e.g. floor=685k → alert range: ₦548k–₦787,750
      const lowerBound = product.floorPrice * (1 - BELOW_FLOOR_THRESHOLD);
      const upperBound = product.floorPrice * (1 + CLOSE_TO_FLOOR_THRESHOLD);

      if (bidAmount >= lowerBound && bidAmount <= upperBound) {
        closeBidAlert = true;
        detectedBid = bidAmount;
      }
    }
  }

  // ── Send owner alert email ────────────────────────────────────────────
  if (closeBidAlert && detectedBid) {
    // Log so you can verify in Vercel logs even if email fails
    console.log(
      `[alert] Close bid detected — product: ${product.name}, bid: ₦${detectedBid.toLocaleString()}, floor: ₦${product.floorPrice.toLocaleString()}, session: ${sessionId}`
    );

    if (process.env.RESEND_API_KEY && process.env.OWNER_EMAIL) {
      const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/negotiations/${sessionId}`;
      const isAboveFloor = detectedBid >= product.floorPrice;
      const bidLabel = isAboveFloor
        ? `₦${detectedBid.toLocaleString()} (at/above floor ✅)`
        : `₦${detectedBid.toLocaleString()} (below floor — room to negotiate 🔥)`;

      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "The Saint's TechNet <notifications@saintstechnet.com>",
          to: [process.env.OWNER_EMAIL],
          subject: `🔔 Close Bid Alert: ${product.name} — ₦${detectedBid.toLocaleString()}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
              <h2 style="color:#f59e0b">🔔 Close Bid Alert</h2>
              <p>A customer is negotiating close to your floor price.</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:8px;color:#666">Product</td><td style="padding:8px;font-weight:bold">${product.name}</td></tr>
                <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Listed Price</td><td style="padding:8px">₦${product.price.toLocaleString()}</td></tr>
                <tr><td style="padding:8px;color:#666">Floor Price</td><td style="padding:8px">₦${product.floorPrice.toLocaleString()}</td></tr>
                <tr style="background:#fef3c7"><td style="padding:8px;color:#666">Customer Bid</td><td style="padding:8px;font-weight:bold;color:#d97706">${bidLabel}</td></tr>
              </table>
              <a href="${adminUrl}" style="display:inline-block;background:#f59e0b;color:#000;font-weight:bold;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:8px">
                View Negotiation &amp; Take Over →
              </a>
              <p style="color:#999;font-size:12px;margin-top:24px">Session ID: ${sessionId}</p>
            </div>
          `,
        }),
      }).catch((err) => console.error("[alert] Email send failed:", err));
    } else {
      console.warn("[alert] Skipping email — RESEND_API_KEY or OWNER_EMAIL not set in env");
    }
  }

  const systemPrompt = buildSystemPrompt(product);

  // ── Stream from Claude ────────────────────────────────────────────────
  const encoder = new TextEncoder();
  const customerMessageContent = lastUserMessage?.content ?? "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Emit sessionId first so the frontend can persist it
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ sessionId })}\n\n`)
        );

        const claudeStream = await anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 400,
          system: systemPrompt,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });

        let fullText = "";

        for await (const chunk of claudeStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            const text = chunk.delta.text;
            fullText += text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }

        // ── Deal detection ────────────────────────────────────────────
        let dealAgreedPrice: number | undefined;
        const dealMatch = fullText.match(/DEAL:₦([\d,]+)/);
        if (dealMatch) {
          const rawAmount = dealMatch[1].replace(/,/g, "");
          const agreedPrice = parseInt(rawAmount, 10);
          if (agreedPrice >= product.floorPrice) {
            dealAgreedPrice = agreedPrice;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ deal: true, agreedPrice, productSlug: slug })}\n\n`)
            );
          } else {
            console.warn(`[negotiate] AI agreed ₦${agreedPrice} below floor ₦${product.floorPrice} — suppressed`);
          }
        }

        // ── Persist to Sanity (non-blocking) ─────────────────────────
        upsertSession({
          sessionId,
          product,
          customerMessage: customerMessageContent,
          aiReply: fullText.replace(/DEAL:₦[\d,]+/g, "").trim(),
          closeBidAlert,
          customerBid: detectedBid,
          dealAgreedPrice,
        }).catch(console.error);

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        console.error("Negotiate stream error:", err);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "AI error. Please try again." })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}

// ── System prompt builder ─────────────────────────────────────────────────
function buildSystemPrompt(product: {
  name: string; price: number; floorPrice: number; negotiationNotes?: string;
}): string {
  const clampToFloor = (raw: number) =>
    Math.max(Math.round(raw / 1000) * 1000, product.floorPrice);

  const step1 = clampToFloor(product.price * 0.97);
  const step2 = clampToFloor(product.price * 0.94);
  const step3 = clampToFloor(product.price * 0.90);

  const allSameAsFloor = step1 === product.floorPrice && step2 === product.floorPrice && step3 === product.floorPrice;

  const concessionSteps = allSameAsFloor
    ? `- Very tight margin. Only concession: ₦${product.floorPrice.toLocaleString()}. Offer under real pressure only.`
    : `- First: ₦${step1.toLocaleString()}\n- Second: ₦${step2.toLocaleString()}\n- Final (heavy pressure only): ₦${step3.toLocaleString()}`;

  return `You are Segun, a sharp but warm sales rep for The Saint's TechNet — a CAC-registered tech store in Lagos run by a Computer Engineer.

Product: ${product.name}
Listed price: ₦${product.price.toLocaleString()}
Your absolute floor (NEVER reveal): ₦${product.floorPrice.toLocaleString()}

CRITICAL: Never agree to any price below ₦${product.floorPrice.toLocaleString()}.

STAGES:
1. Hold firm — highlight engineer-verified quality + warranty
2. Sweeteners first — bag, priority delivery, extended warranty
3. Incremental concessions (all above floor):
${concessionSteps}
4. Floor is final — "Oga I genuinely can't go lower, I'm at cost."
5. Close — end with: DEAL:₦[amount] (no commas, exact format)
   NEVER emit DEAL for any price below ₦${product.floorPrice.toLocaleString()}.

TONE: Warm, confident, 2-4 sentences max, light Nigerian energy.
${product.negotiationNotes ? `\nOWNER NOTES:\n${product.negotiationNotes}` : ""}`;
}