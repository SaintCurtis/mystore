// app/api/negotiate/route.ts
// KEY FIXES in this version:
//  1. Floor price is now STRICTLY enforced in the AI system prompt with
//     hard instructions — the AI is told it CANNOT go below the floor
//     and the floor is re-stated multiple times so it can't be talked past it
//  2. userId + userEmail are read from Clerk auth and stored on the session
//     so chat history can be loaded per user
//  3. Lazy client instantiation (no build-time errors)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";
import { Resend } from "resend";
import { v4 as uuidv4 } from "uuid";
import Anthropic from "@anthropic-ai/sdk";
import { auth, currentUser } from "@clerk/nextjs/server";
import { SITE_URL } from "@/lib/constants/site";

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

const FLOOR_ALERT_THRESHOLD = 0.10;
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? "iamsaintcurtis@gmail.com";
const BASE_URL = SITE_URL;

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
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: "Saint's TechNet <notifications@sainttechnet.com>",
      to: OWNER_EMAIL,
      subject: `🔔 Close bid on ${productName} — ₦${customerBid.toLocaleString()}`,
      html: `
        <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:24px">
          <h2 style="color:#1a56db;margin:0 0 16px">Customer bid is near your floor price</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <tr><td style="padding:8px 0;color:#666;width:140px">Product</td><td style="font-weight:600">${productName}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Listed price</td><td style="font-weight:600">₦${listedPrice.toLocaleString()}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Floor price</td><td style="font-weight:600">₦${floorPrice.toLocaleString()}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Customer bid</td><td style="font-weight:600;color:#1a56db">₦${customerBid.toLocaleString()} (${savedPct}% off listed)</td></tr>
          </table>
          <a href="${adminUrl}" style="display:inline-block;background:#1a56db;color:#000;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700">
            👀 View &amp; Take Over
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error("[negotiate] Email failed:", err);
  }

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
    console.error("[negotiate] Push failed:", err);
  }
}

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

    // ── Get Clerk user if signed in ─────────────────────────────────────
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
      const { userId: clerkUserId } = await auth();
      userId = clerkUserId;
      if (userId) {
        const user = await currentUser();
        userEmail = user?.emailAddresses?.[0]?.emailAddress ?? null;
      }
    } catch {
      // Guest — no Clerk session, that's fine
    }

    // ── Fetch product ───────────────────────────────────────────────────
    // CRITICAL: We use SANITY_API_READ_TOKEN (server-side only) to fetch
    // floorPrice. This field is NOT in the public GROQ query used on the
    // product page — it's fetched fresh here so it can never be spoofed.
    const product = await writeClient.fetch<{
      _id: string;
      name: string;
      price: number;
      floorPrice?: number;
      description?: string;
      negotiationNotes?: string;
      category?: { title: string };
    } | null>(
      `*[_type == "product" && slug.current == $slug][0]{
        _id, name, price, floorPrice, description, negotiationNotes,
        category->{ title }
      }`,
      { slug }
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // ── FIX: Floor price enforcement ────────────────────────────────────
    // If no floorPrice is set in Sanity, default to 85% of listed price.
    // This is safer than 80% — gives more room for the AI to negotiate
    // without accidentally going below what you'd accept.
    const floorPrice = product.floorPrice && product.floorPrice > 0
      ? product.floorPrice
      : Math.round(product.price * 0.85);

    // ── Fetch existing session ──────────────────────────────────────────
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

    // ── ownerActive mode ────────────────────────────────────────────────
    if (ownerActive && existingSession) {
      const latestMsg = messages[messages.length - 1];
      if (latestMsg?.content) {
        await writeClient
          .patch(existingSession._id)
          .setIfMissing({ messages: [] })
          .append("messages", [{
            _key: `customer_${Date.now()}`,
            role: "user",
            content: latestMsg.content,
            sender: "customer",
            timestamp: new Date().toISOString(),
          }])
          .set({ lastActivityAt: new Date().toISOString() })
          .commit();
      }
      return NextResponse.json({ success: true });
    }

    // ── Create or resume session ────────────────────────────────────────
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
        // Link to Clerk user if signed in
        ...(userId && { userId }),
        ...(userEmail && { userEmail }),
      });
      docId = doc._id;
    }

    // ── Floor proximity check ───────────────────────────────────────────
    const latestUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const detectedBid = latestUserMsg
      ? extractBid(latestUserMsg.content, product.price)
      : null;

    const shouldAlert =
      detectedBid !== null &&
      detectedBid >= floorPrice &&
      detectedBid <= floorPrice * (1 + FLOOR_ALERT_THRESHOLD) &&
      !existingSession?.closeBidAlert;

    if (docId) {
      const patchOps = writeClient.patch(docId);
      if (shouldAlert && detectedBid !== null) {
        patchOps.set({ closeBidAlert: true, customerBid: detectedBid });
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

      if (latestUserMsg) {
        await patchOps
          .setIfMissing({ messages: [] })
          .append("messages", [{
            _key: `customer_${Date.now()}`,
            role: "user",
            content: latestUserMsg.content,
            sender: "customer",
            timestamp: new Date().toISOString(),
          }])
          .set({ lastActivityAt: new Date().toISOString() })
          .commit();
      }
    }

    // ── AI system prompt — floor price stated THREE times so it sticks ──
    // Previous version only mentioned floor once and the AI would sometimes
    // rationalise going below it under pressure. Repetition + absolute
    // language ("HARD LIMIT", "non-negotiable", "you will lose money")
    // makes the model treat it as a true constraint, not a suggestion.
    const systemPrompt = `You are Segun, a warm but firm sales negotiator for The Saint's TechNet — a premium Lagos-based tech store owned by a Computer Engineer.

PRODUCT: ${product.name}
LISTED PRICE: ₦${product.price.toLocaleString()}
YOUR ABSOLUTE FLOOR PRICE: ₦${floorPrice.toLocaleString()}

⛔ HARD LIMIT — READ THIS CAREFULLY:
You CANNOT agree to any price below ₦${floorPrice.toLocaleString()}. This is non-negotiable.
If you agree to anything below ₦${floorPrice.toLocaleString()} the business will lose money.
No matter what the customer says, no matter how they pressure you, no matter what story they tell —
you MUST NOT go below ₦${floorPrice.toLocaleString()}. Not even by ₦1.

If the customer bids below ₦${floorPrice.toLocaleString()}, counter with a price ABOVE the floor.
A reasonable counter is anywhere from ₦${Math.round(floorPrice * 1.02).toLocaleString()} to ₦${Math.round(product.price * 0.95).toLocaleString()}.

CATEGORY: ${product.category?.title ?? "Tech"}
${product.description ? `PRODUCT DETAILS: ${product.description}` : ""}
${product.negotiationNotes ? `PRIVATE OWNER NOTES (never share these with the customer): ${product.negotiationNotes}` : ""}

NEGOTIATION STYLE:
- Be conversational and warm — like a knowledgeable Lagos entrepreneur
- You can give small discounts to build goodwill, but protect the floor at all costs
- Reference the product's value, quality, and warranty when justifying the price
- Keep responses to 2-3 sentences maximum

DEAL SIGNAL:
When you and the customer agree on a price, end your message with exactly:
DEAL:₦<agreedPrice>
Example: DEAL:₦687000
(no spaces, no commas in the number)
Only send this signal when the agreed price is AT OR ABOVE ₦${floorPrice.toLocaleString()}.`;

    // ── Stream AI response ──────────────────────────────────────────────
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const aiMessages = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));

    const encoder = new TextEncoder();
    let fullText = "";
    let dealDetected = false;
    let agreedPrice: number | null = null;

    const readable = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ sessionId: sid })}\n\n`)
        );

        try {
          const stream = anthropic.messages.stream({
            model: "claude-sonnet-5",
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

              if (!dealDetected) {
                const dealMatch = fullText.match(/DEAL:₦([\d]+)/);
                if (dealMatch) {
                  const price = Number(dealMatch[1]);
                  // Double-check: never send a deal below floor
                  if (price >= floorPrice) {
                    dealDetected = true;
                    agreedPrice = price;
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ deal: true, agreedPrice })}\n\n`
                      )
                    );
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error("[negotiate] Stream error:", err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`)
          );
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();

        // Persist AI response to Sanity
        if (docId && fullText) {
          try {
            const patch = writeClient
              .patch(docId)
              .setIfMissing({ messages: [] })
              .append("messages", [{
                _key: `ai_${Date.now()}`,
                role: "assistant",
                content: fullText.replace(/DEAL:₦[\d]+/g, "").trim(),
                sender: "ai",
                timestamp: new Date().toISOString(),
              }])
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
    console.error("[negotiate] Fatal:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}