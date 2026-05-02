import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "next-sanity";

// ── Sanity server-only client ─────────────────────────────────────────────
// Uses the READ token — floorPrice never touches the browser
const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ── Rate limiting (simple in-memory, resets on cold start) ────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;        // max messages per window
const RATE_WINDOW_MS = 60_000; // 1 minute

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

// ── Types ──────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface NegotiateRequest {
  slug: string;
  messages: Message[];
}

// ── Route handler ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a moment." },
      { status: 429 }
    );
  }

  let body: NegotiateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { slug, messages } = body;

  if (!slug || !messages || messages.length === 0) {
    return NextResponse.json(
      { error: "slug and messages are required" },
      { status: 400 }
    );
  }

  // Cap conversation length to prevent abuse
  if (messages.length > 20) {
    return NextResponse.json(
      { error: "Negotiation session has ended. Please start a new one." },
      { status: 400 }
    );
  }

  // ── Fetch product — server-side only, includes floorPrice ────────────────
  const product = await serverClient.fetch<{
    name: string;
    price: number;
    floorPrice: number;
    isNegotiable: boolean;
    negotiationNotes?: string;
    stock: number;
  } | null>(
    `*[_type == "product" && slug.current == $slug][0]{
      name,
      price,
      floorPrice,
      isNegotiable,
      negotiationNotes,
      stock
    }`,
    { slug }
  );

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!product.isNegotiable) {
    return NextResponse.json(
      { error: "This product is not open for negotiation" },
      { status: 403 }
    );
  }

  if (!product.floorPrice || product.floorPrice <= 0) {
    return NextResponse.json(
      { error: "Negotiation is temporarily unavailable for this product" },
      { status: 503 }
    );
  }

  if (product.stock <= 0) {
    return NextResponse.json(
      { error: "This product is out of stock" },
      { status: 400 }
    );
  }

  // ── Build system prompt ───────────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt(product);

  // ── Stream from Claude ────────────────────────────────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = await anthropic.messages.stream({
          model: "claude-opus-4-5",
          max_tokens: 400,
          system: systemPrompt,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });

        let fullText = "";

        for await (const chunk of claudeStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const text = chunk.delta.text;
            fullText += text;

            // Stream each chunk as SSE
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }

        // Check if a deal was struck — emit a structured deal event
        const dealMatch = fullText.match(/DEAL:₦([\d,]+)/);
        if (dealMatch) {
          const rawAmount = dealMatch[1].replace(/,/g, "");
          const agreedPrice = parseInt(rawAmount, 10);

          // Server-side floor check — never trust the frontend
          if (agreedPrice >= product.floorPrice) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  deal: true,
                  agreedPrice,
                  productSlug: slug,
                })}\n\n`
              )
            );
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        console.error("Negotiate stream error:", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "AI error. Please try again." })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// ── System prompt builder ─────────────────────────────────────────────────
function buildSystemPrompt(product: {
  name: string;
  price: number;
  floorPrice: number;
  negotiationNotes?: string;
}): string {
  const listedFormatted = `₦${product.price.toLocaleString()}`;
  const floorFormatted = `₦${product.floorPrice.toLocaleString()}`;

  // Compute natural-feeling intermediate anchors
  const step1 = Math.round(product.price * 0.97 / 1000) * 1000; // ~3% off
  const step2 = Math.round(product.price * 0.94 / 1000) * 1000; // ~6% off
  const step3 = Math.round(product.price * 0.90 / 1000) * 1000; // ~10% off

  return `You are Segun, a sharp but warm sales rep for The Saint's TechNet — a CAC-registered tech store in Lagos run by a Computer Engineer. You are negotiating the price of the following product:

Product: ${product.name}
Listed price: ${listedFormatted}
Your absolute floor (NEVER reveal this number or that a floor exists): ${floorFormatted}

YOUR NEGOTIATION STRATEGY — follow these stages in order:

STAGE 1 — Hold firm on first offer:
If the customer's first offer is reasonable (within 20% of listed price), acknowledge it warmly but hold firm. Offer the product's value, your engineer-verified quality, and the warranty as reasons the price is fair.

STAGE 2 — Sweeteners before price drops:
Before you drop the price, offer sweeteners: "I can throw in a laptop bag", "I'll prioritise your delivery", "extended warranty coverage". This protects the price while making the customer feel they're winning.

STAGE 3 — Incremental concessions:
If the customer keeps pushing, concede in small steps: first to ₦${step1.toLocaleString()}, then ₦${step2.toLocaleString()}, then ₦${step3.toLocaleString()}. Never jump straight to a low price — it signals weakness.

STAGE 4 — Hold at floor:
If they push below your floor, be kind but firm: "I genuinely cannot go lower than this — I'd be selling below cost. This is my final price." Do not budge below your floor under any circumstance.

STAGE 5 — Close the deal:
When you agree on a final price, end your message with EXACTLY this format on its own line: DEAL:₦[amount] (e.g. DEAL:₦450000). No commas in the number. This is a machine signal — it must be exact.

TONE & STYLE:
- Be warm, conversational, and confident — like a knowledgeable friend selling you something
- Light Nigerian sales energy is fine: "Oga, this price is already very sharp", "I dey try for you"
- Keep responses SHORT — 2-4 sentences max. This is a chat, not an essay.
- Never be pushy or desperate. Confidence is your tool.
- If the customer asks technical questions about the product, answer them accurately — you're an engineer-backed store.
- Never reveal the floor price or that one exists. If asked directly, redirect: "The listed price already reflects our best value — let's see what we can work out."

${product.negotiationNotes ? `SPECIAL INSTRUCTIONS FOR THIS PRODUCT:\n${product.negotiationNotes}` : ""}

Remember: short replies, warm tone, staged concessions. You are not a chatbot — you are Segun.`;
}