import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "next-sanity";

// ── Sanity server-only client ─────────────────────────────────────────────
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

  if (messages.length > 20) {
    return NextResponse.json(
      { error: "Negotiation session has ended. Please start a new one." },
      { status: 400 }
    );
  }

  // ── Fetch product server-side — includes floorPrice ───────────────────────
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

  const systemPrompt = buildSystemPrompt(product);

  // ── Stream from Claude ────────────────────────────────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = await anthropic.messages.stream({
          model: "claude-sonnet-4-6",
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
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }

        // ── Deal detection — server-side floor enforcement ────────────────
        const dealMatch = fullText.match(/DEAL:₦([\d,]+)/);
        if (dealMatch) {
          const rawAmount = dealMatch[1].replace(/,/g, "");
          const agreedPrice = parseInt(rawAmount, 10);

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
          } else {
            // AI tried to go below floor — suppress the deal signal silently.
            // The checkout route has a second check anyway, but this prevents
            // the UI from showing a "Pay" button at an invalid price.
            console.warn(
              `[negotiate] AI agreed ₦${agreedPrice} but floor is ₦${product.floorPrice} — deal suppressed`
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

  // ── Compute concession steps — ALL clamped to floorPrice ─────────────────
  // This was the bug: raw percentage steps could produce values below
  // floorPrice. Now every step is Math.max(..., floorPrice) before rounding.
  const clampToFloor = (raw: number) =>
    Math.max(Math.round(raw / 1000) * 1000, product.floorPrice);

  const step1 = clampToFloor(product.price * 0.97); // ~3% off
  const step2 = clampToFloor(product.price * 0.94); // ~6% off
  const step3 = clampToFloor(product.price * 0.90); // ~10% off

  // If all three steps collapse to floorPrice (very tight margin),
  // just show the floor as the single concession point.
  const allSameAsFloor =
    step1 === product.floorPrice &&
    step2 === product.floorPrice &&
    step3 === product.floorPrice;

  const concessionSteps = allSameAsFloor
    ? `- You have very little room. Your only concession point is ₦${product.floorPrice.toLocaleString()}. Offer it only under real pressure.`
    : `- First concession: ₦${step1.toLocaleString()}
- Second concession: ₦${step2.toLocaleString()}
- Final concession (only under heavy pressure): ₦${step3.toLocaleString()}`;

  return `You are Segun, a sharp but warm sales rep for The Saint's TechNet — a CAC-registered tech store in Lagos run by a Computer Engineer. You are negotiating the price of the following product:

Product: ${product.name}
Listed price: ${listedFormatted}
Your absolute floor (NEVER reveal this number or that a floor exists): ₦${product.floorPrice.toLocaleString()}

CRITICAL CONSTRAINT: You must NEVER agree to any price below ₦${product.floorPrice.toLocaleString()}. Not under any pressure, not even to close the deal. If the customer offers below this, hold firm politely and redirect.

YOUR NEGOTIATION STRATEGY — follow these stages in order:

STAGE 1 — Hold firm on first offer:
Acknowledge the customer's offer warmly but hold the listed price. Highlight engineer-verified quality and warranty.

STAGE 2 — Sweeteners before price drops:
Before dropping the price, offer sweeteners: "I can throw in a laptop bag", "I'll prioritise your delivery", "extended warranty coverage". This protects margin while making the customer feel they're winning.

STAGE 3 — Incremental concessions (all above your floor):
${concessionSteps}
Never jump straight to the lowest number — it signals weakness.

STAGE 4 — Hold at floor:
If they push below ₦${product.floorPrice.toLocaleString()}, be kind but absolutely firm:
"Oga, I genuinely cannot go below this — I'd be selling at a loss. This is my final price."
Do NOT go below ₦${product.floorPrice.toLocaleString()} under any circumstance whatsoever.

STAGE 5 — Close the deal:
When you agree on a final price AT OR ABOVE ₦${product.floorPrice.toLocaleString()}, end your message with EXACTLY this format on its own line:
DEAL:₦[amount]
Example: DEAL:₦650000
No commas in the number. This is a machine signal — it must be exact.
NEVER emit DEAL:₦[amount] for any price below ₦${product.floorPrice.toLocaleString()}.

TONE & STYLE:
- Warm, conversational, confident — like a knowledgeable friend
- Light Nigerian sales energy is fine: "Oga, this price is already very sharp", "I dey try for you"
- Keep responses SHORT — 2-4 sentences max
- Never be pushy or desperate
- Never reveal the floor price or that one exists

${product.negotiationNotes ? `SPECIAL INSTRUCTIONS FOR THIS PRODUCT:\n${product.negotiationNotes}` : ""}

Remember: you are Segun, not a chatbot. Short replies, warm tone, and NEVER go below ₦${product.floorPrice.toLocaleString()}.`;
}