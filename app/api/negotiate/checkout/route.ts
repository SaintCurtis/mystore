import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "next-sanity";

// ── Sanity server-only client ──────────────────────────────────────────────
const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
});

if (!process.env.PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY is not defined");
}

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// ── Types ──────────────────────────────────────────────────────────────────
interface NegotiatedCheckoutRequest {
  productSlug: string;
  agreedPrice: number;
  // Optional: selected variants (e.g. RAM/SSD choices)
  selectedVariants?: { type: string; label: string }[];
}

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

// ── Route handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Auth check
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return NextResponse.json(
      { error: "Please sign in to complete your purchase" },
      { status: 401 }
    );
  }

  let body: NegotiatedCheckoutRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { productSlug, agreedPrice, selectedVariants = [] } = body;

  if (!productSlug || !agreedPrice) {
    return NextResponse.json(
      { error: "productSlug and agreedPrice are required" },
      { status: 400 }
    );
  }

  // ── Fetch product server-side — second floor check ────────────────────────
  // We NEVER trust the agreedPrice from the frontend alone.
  // We re-fetch the floorPrice here and verify again.
  const product = await serverClient.fetch<{
    _id: string;
    name: string;
    price: number;
    floorPrice: number;
    isNegotiable: boolean;
    stock: number;
    images: { asset: { url: string } }[];
  } | null>(
    `*[_type == "product" && slug.current == $slug][0]{
      _id,
      name,
      price,
      floorPrice,
      isNegotiable,
      stock,
      "images": images[0..0]{ asset->{ url } }
    }`,
    { slug: productSlug }
  );

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!product.isNegotiable) {
    return NextResponse.json(
      { error: "This product is not negotiable" },
      { status: 403 }
    );
  }

  if (product.stock <= 0) {
    return NextResponse.json(
      { error: "This product is out of stock" },
      { status: 400 }
    );
  }

  // ── Server-side floor price enforcement ───────────────────────────────────
  if (agreedPrice < product.floorPrice) {
    // Someone tried to tamper with the price — reject silently with a generic error
    return NextResponse.json(
      { error: "Invalid price. Please restart the negotiation." },
      { status: 400 }
    );
  }

  // agreedPrice should never exceed listed price either
  if (agreedPrice > product.price) {
    return NextResponse.json(
      { error: "Invalid agreed price" },
      { status: 400 }
    );
  }

  // ── Build Paystack transaction ─────────────────────────────────────────────
  const userEmail = user.emailAddresses[0]?.emailAddress ?? "";
  const userName =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || userEmail;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3000";

  const amountKobo = Math.round(agreedPrice * 100);

  const variantString =
    selectedVariants.length > 0
      ? selectedVariants.map((v) => `${v.type}:${v.label}`).join("|")
      : "";

  const metadata: Record<string, string> = {
    clerkUserId: userId,
    userEmail,
    sanityCustomerId: "",          // populated if you have getOrCreatePaystackCustomer
    productIds: product._id,
    quantities: "1",
    prices: amountKobo.toString(),
    shippingFee: "0",
    shippingMethod: "",
    shippingAddress: "",
    // ── Negotiation-specific metadata ──────────────────────────────────────
    isNegotiatedDeal: "true",
    originalPrice: product.price.toString(),
    agreedPrice: agreedPrice.toString(),
    savedAmount: (product.price - agreedPrice).toString(),
    productName: product.name,
    ...(variantString && { selectedVariants: variantString }),
    buyerName: userName,
  };

  try {
    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          amount: amountKobo,
          currency: "NGN",
          callback_url: `${baseUrl}/checkout/success`,
          metadata,
          // Custom label shown on Paystack payment page
          label: `${product.name} — Negotiated Deal`,
        }),
      }
    );

    const data = (await response.json()) as PaystackInitResponse;

    if (!data.status || !data.data?.authorization_url) {
      console.error("Paystack init failed:", data.message);
      return NextResponse.json(
        { error: "Could not initialize payment. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      url: data.data.authorization_url,
      reference: data.data.reference,
      // Return summary for UI display before redirect
      summary: {
        productName: product.name,
        originalPrice: product.price,
        agreedPrice,
        savedAmount: product.price - agreedPrice,
        savedPercent: Math.round(
          ((product.price - agreedPrice) / product.price) * 100
        ),
      },
    });
  } catch (err) {
    console.error("Negotiated checkout error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}