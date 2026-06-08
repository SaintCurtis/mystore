import { generateText, gateway } from "ai";

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json();

    if (!description && !name) {
      return Response.json(
        { success: false, error: "No product name or description provided" },
        { status: 400 }
      );
    }

    const { text } = await generateText({
      model: gateway("anthropic/claude-sonnet-4"),
      system: `You are a tech product spec extraction assistant.
Given a product name and/or description, extract structured specification fields.
Return ONLY valid JSON — no markdown, no backticks, no explanation.

Return this exact JSON shape (use null for any field you cannot determine):
{
  "specDisplay": string | null,
  "specProcessor": string | null,
  "specRAM": string | null,
  "specStorage": string | null,
  "specGPU": string | null,
  "specBattery": string | null,
  "specOS": string | null,
  "specConnectivity": string | null,
  "specRefreshRate": string | null,
  "specWeight": string | null,
  "specExtras": [{ "label": string, "value": string }]
}

Rules:
- specDisplay: screen size + resolution + panel type, e.g. "13.4\\" 3K OLED" or "27\\" QHD IPS"
- specProcessor: chip name only, e.g. "Intel Core Ultra 7 265H" or "Apple M3"
- specRAM: amount + type, e.g. "16GB LPDDR5x" or "32GB DDR5"
- specStorage: amount + type, e.g. "1TB NVMe SSD" or "2TB PCIe Gen 4"
- specGPU: full GPU name, e.g. "NVIDIA RTX 4080 Super" or "Intel Arc Graphics"
- specBattery: capacity + life if available, e.g. "55Wh · up to 18 hrs" or "1024Wh LFP"
- specOS: e.g. "Windows 11 Pro" or "macOS Sequoia"
- specConnectivity: ports + wireless, e.g. "2× Thunderbolt 4, Wi-Fi 7, Bluetooth 5.3"
- specRefreshRate: e.g. "240Hz" or "180Hz" — only if display refresh rate is mentioned
- specWeight: e.g. "1.18kg" — only if mentioned
- specExtras: any other notable specs not covered above (panel type, cooling system, webcam, audio, etc.)
- Keep values concise — max 60 characters per field
- If the product is not a computer/monitor/tech device with these specs, return null for all fields and empty specExtras`,
      prompt: `Product name: ${name ?? "Unknown"}

Product description:
${description ?? "No description provided"}

Extract the tech specs from the above.`,
    });

    // Strip any accidental markdown fences
    const clean = text.replace(/```json|```/g, "").trim();
    const specs = JSON.parse(clean);

    // Sanitise — drop null values so we only return populated fields
    const filtered = Object.fromEntries(
      Object.entries(specs).filter(([, v]) => v !== null && v !== "")
    );

    return Response.json({ success: true, specs: filtered });
  } catch (error) {
    console.error("Spec extraction failed:", error);
    return Response.json(
      { success: false, error: "Failed to extract specs" },
      { status: 500 }
    );
  }
}