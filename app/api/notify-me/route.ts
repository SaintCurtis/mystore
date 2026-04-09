import { NextResponse } from "next/server";
import { writeClient, client } from "@/sanity/lib/client";
import { defineQuery } from "next-sanity";

// ✅ Lazy getter — only instantiated when a request is made, not at build time
function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  const { Resend } = require("resend");
  return new Resend(apiKey);
}

const EXISTING_SUB_QUERY = defineQuery(`
  *[_type == "notifyMe" && email == $email && product._ref == $productId && notified == false][0]{ _id }
`);

const PRODUCT_QUERY = defineQuery(`
  *[_type == "product" && _id == $id][0]{
    _id, name, "slug": slug.current, price, stock, "image": images[0].asset->url
  }
`);

// POST /api/notify-me — subscribe an email for a product
export async function POST(req: Request) {
  try {
    const { email, productId, productName } = await req.json();

    if (!email || !productId) {
      return NextResponse.json({ error: "Missing email or productId" }, { status: 400 });
    }

    // Check already subscribed
    const existing = await client.fetch(EXISTING_SUB_QUERY, { email, productId });
    if (existing) {
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    // Store in Sanity
    await writeClient.create({
      _type: "notifyMe",
      email,
      product: { _type: "reference", _ref: productId },
      productName,
      notified: false,
      createdAt: new Date().toISOString(),
    });

    // Send confirmation email
    try {
      const resend = getResend();
      await resend.emails.send({
        from: "The Saint's TechNet <noreply@saintstechnet.com>",
        to: email,
        subject: `You're on the waitlist for ${productName}`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;">
            <div style="background:#f59e0b;border-radius:12px;padding:4px 16px;display:inline-block;margin-bottom:16px;">
              <span style="color:#000;font-weight:800;font-size:14px;">THE SAINT'S TECHNET</span>
            </div>
            <h2 style="font-size:22px;font-weight:800;margin:0 0 8px;">You're on the waitlist! 🎉</h2>
            <p style="color:#555;margin:0 0 16px;">
              We'll email you the moment <strong>${productName}</strong> is back in stock.
              You'll be first to know!
            </p>
            <p style="color:#999;font-size:12px;">
              — The Saint's TechNet Team<br/>
              Built by an Engineer. Trusted by Thousands.
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      // Email failure shouldn't block the subscription from being saved
      console.error("Confirmation email failed:", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notify Me subscribe error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// GET /api/notify-me?productId=xxx&secret=xxx — trigger notifications when stock is restored
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const secret = searchParams.get("secret");

  if (secret !== process.env.NOTIFY_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  try {
    const product = await client.fetch(PRODUCT_QUERY, { id: productId });
    if (!product || (product.stock ?? 0) === 0) {
      return NextResponse.json({ message: "Product still out of stock" });
    }

    const subscribers = await client.fetch(
      `*[_type == "notifyMe" && product._ref == $productId && notified == false]{ _id, email }`,
      { productId }
    );

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: "No subscribers" });
    }

    const productUrl = `https://mystore-drab-nine.vercel.app/products/${product.slug}`;
    const resend = getResend();

    const results = await Promise.allSettled(
      subscribers.map(async (sub: { _id: string; email: string }) => {
        await resend.emails.send({
          from: "The Saint's TechNet <noreply@saintstechnet.com>",
          to: sub.email,
          subject: `${product.name} is back in stock! 🔥`,
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;">
              <div style="background:#f59e0b;border-radius:12px;padding:4px 16px;display:inline-block;margin-bottom:16px;">
                <span style="color:#000;font-weight:800;font-size:14px;">THE SAINT'S TECHNET</span>
              </div>
              <h2 style="font-size:22px;font-weight:800;margin:0 0 8px;">It's back! 🎉</h2>
              <p style="color:#333;margin:0 0 16px;">
                <strong>${product.name}</strong> is back in stock at ₦${product.price?.toLocaleString()}.
                Limited units — grab yours before it sells out again!
              </p>
              ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width:100%;border-radius:12px;margin-bottom:16px;" />` : ""}
              <a href="${productUrl}" style="display:inline-block;background:#f59e0b;color:#000;font-weight:800;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;">
                Shop Now →
              </a>
              <p style="color:#999;font-size:12px;margin-top:20px;">
                You subscribed to be notified about this product.<br/>
                — The Saint's TechNet
              </p>
            </div>
          `,
        });

        await writeClient
          .patch(sub._id)
          .set({ notified: true, notifiedAt: new Date().toISOString() })
          .commit();
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return NextResponse.json({ message: `Notified ${sent}/${subscribers.length} subscribers` });
  } catch (error) {
    console.error("Notify trigger error:", error);
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 });
  }
}