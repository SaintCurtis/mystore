import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");

  // Verify the secret matches
  if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json(
      { message: "Invalid secret" },
      { status: 401 }
    );
  }

  try {
    // Revalidate all pages that use Sanity data
    revalidatePath("/", "layout");        // homepage + all layouts
    revalidatePath("/products", "layout"); // all product pages
    revalidateTag("sanity");              // any fetch tagged with "sanity"

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      message: "Cache revalidated successfully",
    });
  } catch (err) {
    return NextResponse.json(
      { message: "Error revalidating", error: String(err) },
      { status: 500 }
    );
  }
}

// Also handle GET for easy manual testing
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");

  if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  try {
    revalidatePath("/", "layout");
    revalidatePath("/products", "layout");
    revalidateTag("sanity");

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      message: "Cache revalidated successfully",
    });
  } catch (err) {
    return NextResponse.json(
      { message: "Error revalidating", error: String(err) },
      { status: 500 }
    );
  }
}