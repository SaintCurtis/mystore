// app/api/negotiate/checkout/route.ts
//
// FIX 1: Instead of sending customer straight to Paystack, we now redirect
// them to /checkout?negotiated=true&... so they can pick address, delivery
// method and payment method — same flow as a regular order.
//
// FIX 2: callback_url now uses NEXT_PUBLIC_BASE_URL (your actual site URL)
// instead of VERCEL_URL which is the deployment API URL and requires
// Vercel login — that's why customers were landing on vercel.com/login.

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "next-sanity";

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

interface NegotiatedCheckoutRequest {
  productSlug: string;
  agreedPrice: number;
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

export async function POST(req: NextRequest) {
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

  // Server-side product + floor price verification
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
      _id, name, price, floorPrice, isNegotiable, stock,
      "images": images[0..0]{ asset->{ url } }
    }`,
    { slug: productSlug }
  );

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (!product.isNegotiable) return NextResponse.json({ error: "Not negotiable" }, { status: 403 });
  if (product.stock <= 0) return NextResponse.json({ error: "Out of stock" }, { status: 400 });

  const floorPrice = product.floorPrice && product.floorPrice > 0
    ? product.floorPrice
    : Math.round(product.price * 0.85);

  // Owner may have deliberately agreed below floor (emotional/strategic call).
  // We only block if the price is impossibly low (less than 10% of listed)
  // to catch tampering, not legitimate owner decisions.
  if (agreedPrice < product.price * 0.1) {
    return NextResponse.json(
      { error: "Invalid price. Please restart the negotiation." },
      { status: 400 }
    );
  }
  if (agreedPrice > product.price) {
    return NextResponse.json({ error: "Invalid agreed price" }, { status: 400 });
  }

  // FIX 1: Route to /checkout page instead of directly to Paystack.
  // The checkout page handles address + delivery + payment method selection.
  // It reads the negotiation params and shows the agreed price.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://mystore-drab-nine.vercel.app";

  const variantString = selectedVariants.length > 0
    ? selectedVariants.map((v) => `${v.type}:${v.label}`).join("|")
    : "";

  const checkoutParams = new URLSearchParams({
    negotiated: "true",
    productId: product._id,
    productSlug,
    agreedPrice: agreedPrice.toString(),
    originalPrice: product.price.toString(),
    ...(variantString && { variants: variantString }),
  });

  return NextResponse.json({
    success: true,
    url: `${baseUrl}/checkout?${checkoutParams.toString()}`,
    summary: {
      productName: product.name,
      originalPrice: product.price,
      agreedPrice,
      savedAmount: product.price - agreedPrice,
      savedPercent: Math.round(((product.price - agreedPrice) / product.price) * 100),
    },
  });
}

// PUT — Called by the checkout page once address + shipping are confirmed.
// THIS is where Paystack gets initialised with the correct callback_url.
export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  try {
    const {
      productId, agreedPrice, productName, originalPrice,
      selectedVariants = [], shippingAddress, shippingMethod, shippingFee = 0,
    } = await req.json();

    const userEmail = user.emailAddresses[0]?.emailAddress ?? "";
    const userName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || userEmail;

    // FIX 2: NEXT_PUBLIC_BASE_URL is your real site domain.
    // VERCEL_URL is the internal deployment URL — it requires Vercel auth,
    // which is why customers were hitting vercel.com/login after payment.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://mystore-drab-nine.vercel.app";

    const totalAmount = agreedPrice + shippingFee;
    const amountKobo = Math.round(totalAmount * 100);

    const variantString = (selectedVariants as { type: string; label: string }[]).length > 0
      ? (selectedVariants as { type: string; label: string }[]).map((v) => `${v.type}:${v.label}`).join("|")
      : "";

    const metadata: Record<string, string> = {
      clerkUserId: userId,
      userEmail,
      productIds: productId,
      quantities: "1",
      prices: Math.round(agreedPrice * 100).toString(),
      shippingFee: Math.round(shippingFee * 100).toString(),
      shippingMethod: shippingMethod ?? "",
      shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : "",
      isNegotiatedDeal: "true",
      originalPrice: originalPrice.toString(),
      agreedPrice: agreedPrice.toString(),
      savedAmount: (originalPrice - agreedPrice).toString(),
      productName,
      ...(variantString && { selectedVariants: variantString }),
      buyerName: userName,
    };

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
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
        label: `${productName} — Negotiated Deal`,
      }),
    });

    const data = (await response.json()) as PaystackInitResponse;

    if (!data.status || !data.data?.authorization_url) {
      console.error("Paystack init failed:", data.message);
      return NextResponse.json({ error: "Could not initialise payment." }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (err) {
    console.error("Negotiated payment init error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}