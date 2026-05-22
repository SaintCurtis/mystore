// app/api/negotiate/route.ts
// THE MAIN NEGOTIATION ROUTE — was missing entirely, typing code was here instead.
//
// Handles:
//  1. Creating/resuming a Sanity negotiation session
//  2. Streaming AI responses via Anthropic
//  3. Recording all messages (customer + AI) to Sanity
//  4. ownerActive:true flag — records customer message only, no AI invoked
//  5. Floor price proximity detection → Resend email + push notification alert
//  6. Deal detection (DEAL:₦<price> signal in AI response)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";
import { Resend } from "resend";
import { v4 as uuidv4 } from "uuid";
import Anthropic from "@anthropic-ai/sdk";

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

const resend = new Resend(process.env.RESEND_API_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Within what fraction of the floor price do we alert the owner?
// 0.10 = customer bid is within 10% above the floor → fire alert
const FLOOR_ALERT_THRESHOLD = 0.10;
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? "iamsaintcurtis@gmail.com";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://mystore-drab-nine.vercel.app";

// ── Floor proximity alert ─────────────────────────────────────────────────
async function sendFloorAlert(params: {
  sessionId: string;
  productName: string;
  listedPrice: number;
  floorPrice: number;
  customerBid: number;
}) {
  const { sessionId, productName, listedPrice, floorPrice, customerBid } = params;
  const adminUrl = `${BASE_URL}/admin/negotiations/${sessionId}`;
  const savedPct = Math.round(((listedPrice - customerBid) / listedPrice) * 100);

  // Email via Resend
  try {
    await resend.emails.send({
      from: "Saint's TechNet <notifications@sainttechnet.com>",
      to: OWNER_EMAIL,
      subject: `🔔 Close bid on ${productName} — ₦${customerBid.toLocaleString()}`,
      html: `
        <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:24px">
          <h2 style="color:#f59e0b;margin:0 0 16px">Customer bid is near your floor price</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <tr><td style="padding:8px 0;color:#666;width:140px">Product</td><td style="font-weight:600">${productName}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Listed price</td><td style="font-weight:600">₦${listedPrice.toLocaleString()}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Your floor price</td><td style="font-weight:600">₦${floorPrice.toLocaleString()}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Customer bid</td><td style="font-weight:600;color:#f59e0b">₦${customerBid.toLocaleString()} (${savedPct}% off listed)</td></tr>
          </table>
          <a href="${adminUrl}" style="display:inline-block;background:#f59e0b;color:#000;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
            👀 View &amp; Take Over Negotiation
          </a>
          <p style="color:#999;font-size:12px;margin-top:24px">
            Automated alert from The Saint's TechNet negotiation system.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[negotiate] Resend email failed:", err);
  }

  // Push notification via your existing /push/send endpoint
  try {
    await fetch(`${BASE_URL}/push/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `🔔 Close bid — ${productName}`,
        body: `Customer offered ₦${customerBid.toLocaleString()} (floor: ₦${floorPrice.toLocaleString()})`,
        url: adminUrl,
        internal: true,
      }),
    });
  } catch (err) {
    console.error("[negotiate] Push notification failed:", err);
  }
}

// ── Extract a plausible bid amount from message text ─────────────────────
function extractBid(text: string, listedPrice: number): number | null {
  const matches = text.match(/[\d,]+/g);
  if (!matches) return null;
  const nums = matches
    .map((n) => Number(n.replace(/,/g, "")))
    .filter((n) => n >= 5_000 && n <= listedPrice * 1.5);
  return nums.length > 0 ? Math.max(...nums) : null;
}

// ── POST /api/negotiate ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, sessionId, messages, ownerActive } = body as {
      slug: string;
      sessionId?: string;
      messages: { role: "user" | "assistant"; content: string }[];
      ownerActive?: boolean;
    };

    if (!slug) {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }

    // ── Fetch product ───────────────────────────────────────────────────
    const product = await writeClient.fetch<{
      _id: string;
      name: string;
      price: number;
      floorPrice?: number;
      description?: string;
      category?: { title: string };
    } | null>(
      `*[_type == "product" && slug.current == $slug][0]{
        _id, name, price, floorPrice, description, category->{ title }
      }`,
      { slug }
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const floorPrice = product.floorPrice ?? Math.round(product.price * 0.8);

    // ── Fetch existing session if we have a sessionId ───────────────────
    const existingSession = sessionId
      ? await writeClient.fetch<{
          _id: string;
          status: string;
          closeBidAlert: boolean;
        } | null>(
          `*[_type == "negotiationSession" && sessionId == $sessionId][0]{
            _id, status, closeBidAlert
          }`,
          { sessionId }
        )
      : null;

    // ── ownerActive mode: record customer message only, no AI ───────────
    // Called when the owner has taken over and the customer sends a reply.
    // We write the message to Sanity so the admin dashboard sees it,
    // but we do NOT stream an AI response.
    if (ownerActive && existingSession) {
      const latestMsg = messages[messages.length - 1];
      if (latestMsg?.content) {
        await writeClient
          .patch(existingSession._id)
          .setIfMissing({ messages: [] })
          .append("messages", [
            {
              _key: `customer_${Date.now()}`,
              role: "user",
              content: latestMsg.content,
              sender: "customer",
              timestamp: new Date().toISOString(),
            },
          ])
          .set({ lastActivityAt: new Date().toISOString() })
          .commit();
      }
      return NextResponse.json({ success: true });
    }

    // ── Create session if new ───────────────────────────────────────────
    let sid = sessionId ?? uuidv4();
    let docId = existingSession?._id;

    if (!existingSession) {
      const doc = await writeClient.create({
        _type: "negotiationSession",
        sessionId: sid,
        productId: product._id,
        productName: product.name,
        productSlug: slug,
        listedPrice: product.price,
        floorPrice,
        status: "ai_active",
        closeBidAlert: false,
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        messages: [],
      });
      docId = doc._id;
    }

    // ── Floor price proximity check ─────────────────────────────────────
    const latestUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const detectedBid = latestUserMsg
      ? extractBid(latestUserMsg.content, product.price)
      : null;

    const shouldAlert =
      detectedBid !== null &&
      detectedBid >= floorPrice &&
      detectedBid <= floorPrice * (1 + FLOOR_ALERT_THRESHOLD) &&
      !existingSession?.closeBidAlert; // only alert once per session

    if (docId) {
      const patchOps = writeClient.patch(docId);

      if (shouldAlert && detectedBid !== null) {
        patchOps.set({ closeBidAlert: true, customerBid: detectedBid });
        // Fire notifications concurrently — don't await, don't block the stream
        sendFloorAlert({
          sessionId: sid,
          productName: product.name,
          listedPrice: product.price,
          floorPrice,
          customerBid: detectedBid,
        });
      } else if (detectedBid !== null) {
        patchOps.set({ customerBid: detectedBid });
      }

      // Append customer message to Sanity
      if (latestUserMsg) {
        await patchOps
          .setIfMissing({ messages: [] })
          .append("messages", [
            {
              _key: `customer_${Date.now()}`,
              role: "user",
              content: latestUserMsg.content,
              sender: "customer",
              timestamp: new Date().toISOString(),
            },
          ])
          .set({ lastActivityAt: new Date().toISOString() })
          .commit();
      }
    }

    // ── Build AI system prompt ──────────────────────────────────────────
    const systemPrompt = `You are Segun, a warm but firm sales negotiator for The Saint's TechNet — a premium Lagos-based tech store owned and run by a Computer Engineer.

Product: ${product.name}
Listed price: ₦${product.price.toLocaleString()}
Your floor price (NEVER reveal this to the customer): ₦${floorPrice.toLocaleString()}
Category: ${product.category?.title ?? "Tech"}
${product.description ? `Description: ${product.description}` : ""}

Negotiation rules:
- You can offer small discounts to build goodwill, but NEVER go below ₦${floorPrice.toLocaleString()}
- Be conversational, warm, and confident — like a knowledgeable Lagos entrepreneur who knows the value of their product
- When you both agree on a price, end your message with exactly: DEAL:₦<agreedPrice> (no spaces, no commas — e.g. DEAL:₦285000)
- Never mention or hint at the floor price
- Keep responses concise — 2 to 3 sentences maximum
- If the customer bids below the floor, politely decline and counter with a reasonable figure above the floor`;

    // ── Stream AI response ──────────────────────────────────────────────
    const aiMessages = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));

    const encoder = new TextEncoder();
    let fullText = "";
    let dealDetected = false;
    let agreedPrice: number | null = null;

    const readable = new ReadableStream({
      async start(controller) {
        // Send sessionId immediately so the client can store it
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ sessionId: sid })}\n\n`)
        );

        try {
          const stream = anthropic.messages.stream({
            model: "claude-sonnet-4-20250514",
            max_tokens: 400,
            system: systemPrompt,
            messages: aiMessages,
          });

          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              const text = chunk.delta.text;
              fullText += text;

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );

              // Detect deal signal as it streams in
              if (!dealDetected) {
                const dealMatch = fullText.match(/DEAL:₦([\d]+)/);
                if (dealMatch) {
                  dealDetected = true;
                  agreedPrice = Number(dealMatch[1]);
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ deal: true, agreedPrice })}\n\n`
                    )
                  );
                }
              }
            }
          }
        } catch (err) {
          console.error("[negotiate] Stream error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "AI stream failed" })}\n\n`
            )
          );
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();

        // ── Persist AI response to Sanity after stream ends ─────────────
        if (docId && fullText) {
          try {
            const patch = writeClient
              .patch(docId)
              .setIfMissing({ messages: [] })
              .append("messages", [
                {
                  _key: `ai_${Date.now()}`,
                  role: "assistant",
                  content: fullText.replace(/DEAL:₦[\d]+/g, "").trim(),
                  sender: "ai",
                  timestamp: new Date().toISOString(),
                },
              ])
              .set({ lastActivityAt: new Date().toISOString() });

            if (dealDetected && agreedPrice) {
              patch.set({ status: "deal_struck", agreedPrice });
            }

            await patch.commit();
          } catch (err) {
            console.error("[negotiate] Sanity persist failed:", err);
          }
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[negotiate] Fatal error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}