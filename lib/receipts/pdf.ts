/**
 * PDF renderer for receipt_issuance.
 *
 * Takes a stored receipt and returns the bytes of an A4 PDF. Nothing here
 * touches the network or the database, so the same receipt always renders
 * the same way (download, email attachment, re-download next year).
 *
 * Type: Plus Jakarta Sans (one of the site's own typefaces) in three weights,
 * embedded from lib/receipts/assets/fonts. It is used because it contains the
 * Naira sign (₦); the standard PDF fonts don't. If the font files can't be
 * read for any reason the renderer falls back to Helvetica and prints "NGN"
 * instead of "₦", so issuing a receipt can never fail on a missing font.
 */

import fs from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import {
  degrees,
  LineCapStyle,
  PDFDocument,
  type PDFFont,
  type PDFPage,
  rgb,
  StandardFonts,
} from "pdf-lib";
import { RECEIPT_BUSINESS } from "./config";
import {
  formatReceiptDate,
  formatReceiptDateTime,
  formatReceiptTime,
} from "./dates";
import { amountInWords } from "./money";
import {
  ITEM_CONDITION_LABELS,
  PAYMENT_METHOD_LABELS,
  type ReceiptItem,
  type StoredReceipt,
} from "./types";

// ── Page and palette ─────────────────────────────────────────────────────

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 44;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_RULE_TOP = PAGE_H - 62; // distance from the top edge
const CONTENT_BOTTOM = FOOTER_RULE_TOP - 18;

const hex = (value: string) => {
  const n = parseInt(value.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const C = {
  ink: hex("#1d1b19"),
  muted: hex("#6b665f"),
  faint: hex("#a8a29a"),
  rule: hex("#e6e2dc"),
  tint: hex("#f4f2ee"),
  brand: hex("#ba4b00"), // the store's burnt orange
  green: hex("#15803d"),
  badge: hex("#16a34a"),
  red: hex("#b91c1c"),
  white: hex("#ffffff"),
};

// ── Fonts ────────────────────────────────────────────────────────────────

interface FontSet {
  regular: PDFFont;
  semibold: PDFFont;
  extrabold: PDFFont;
  custom: boolean;
  charset: Set<number> | null;
}

const FONT_DIR = path.join(process.cwd(), "lib", "receipts", "assets", "fonts");

let fontBytesPromise: Promise<{
  regular: Buffer;
  semibold: Buffer;
  extrabold: Buffer;
} | null> | null = null;

function loadFontBytes() {
  if (!fontBytesPromise) {
    fontBytesPromise = (async () => {
      try {
        const [regular, semibold, extrabold] = await Promise.all([
          fs.readFile(path.join(FONT_DIR, "PlusJakartaSans-Regular.ttf")),
          fs.readFile(path.join(FONT_DIR, "PlusJakartaSans-SemiBold.ttf")),
          fs.readFile(path.join(FONT_DIR, "PlusJakartaSans-ExtraBold.ttf")),
        ]);
        return { regular, semibold, extrabold };
      } catch (err) {
        console.error(
          "[receipts/pdf] Could not read font files, using Helvetica:",
          err,
        );
        return null;
      }
    })();
  }
  return fontBytesPromise;
}

async function embedFonts(doc: PDFDocument): Promise<FontSet> {
  const bytes = await loadFontBytes();
  if (bytes) {
    try {
      doc.registerFontkit(fontkit);
      const [regular, semibold, extrabold] = await Promise.all([
        doc.embedFont(bytes.regular, { subset: true }),
        doc.embedFont(bytes.semibold, { subset: true }),
        doc.embedFont(bytes.extrabold, { subset: true }),
      ]);
      return {
        regular,
        semibold,
        extrabold,
        custom: true,
        charset: new Set(regular.getCharacterSet()),
      };
    } catch (err) {
      console.error(
        "[receipts/pdf] Could not embed fonts, using Helvetica:",
        err,
      );
    }
  }
  const [regular, semibold, extrabold] = await Promise.all([
    doc.embedFont(StandardFonts.Helvetica),
    doc.embedFont(StandardFonts.HelveticaBold),
    doc.embedFont(StandardFonts.HelveticaBold),
  ]);
  return { regular, semibold, extrabold, custom: false, charset: null };
}

// ── Small helpers ────────────────────────────────────────────────────────

class Painter {
  constructor(
    public doc: PDFDocument,
    public fonts: FontSet,
  ) {}

  /** Make text safe to draw: curly quotes, and "?" for glyphs the font lacks. */
  clean(input: string): string {
    let text = input.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ");
    if (!this.fonts.custom) {
      text = text
        .replace(/₦/g, "NGN ")
        .replace(/[’‘]/g, "'")
        .replace(/[“”]/g, '"');
      return Array.from(text)
        .map((ch) =>
          ch.charCodeAt(0) <= 0xff || "–—•".includes(ch) ? ch : "?",
        )
        .join("");
    }
    const charset = this.fonts.charset;
    if (!charset) return text;
    return Array.from(text)
      .map((ch) => (charset.has(ch.codePointAt(0) ?? 0) ? ch : "?"))
      .join("");
  }

  money(amount: number): string {
    const rounded = Math.round(amount);
    const digits = Math.abs(rounded).toLocaleString("en-NG");
    return this.clean(`${rounded < 0 ? "-" : ""}₦${digits}`);
  }

  width(text: string, font: PDFFont, size: number): number {
    return font.widthOfTextAtSize(text, size);
  }

  /** Draw one line; y is the baseline measured down from the top of the page. */
  text(
    page: PDFPage,
    raw: string,
    x: number,
    y: number,
    opts: {
      font: PDFFont;
      size: number;
      color?: ReturnType<typeof rgb>;
      align?: "left" | "right" | "center";
    },
  ) {
    const text = this.clean(raw);
    if (!text) return;
    const w = this.width(text, opts.font, opts.size);
    const left =
      opts.align === "right" ? x - w : opts.align === "center" ? x - w / 2 : x;
    page.drawText(text, {
      x: left,
      y: PAGE_H - y,
      size: opts.size,
      font: opts.font,
      color: opts.color ?? C.ink,
    });
  }

  /** Split text into lines no wider than maxWidth. Breaks long unbroken strings too. */
  wrap(raw: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const text = this.clean(raw).trim();
    if (!text) return [];
    const lines: string[] = [];
    let line = "";

    const pushWord = (word: string) => {
      const candidate = line ? `${line} ${word}` : word;
      if (this.width(candidate, font, size) <= maxWidth) {
        line = candidate;
        return;
      }
      if (line) {
        lines.push(line);
        line = "";
      }
      if (this.width(word, font, size) <= maxWidth) {
        line = word;
        return;
      }
      // A single word wider than the column (a long serial number, say)
      let chunk = "";
      for (const ch of Array.from(word)) {
        if (this.width(chunk + ch, font, size) > maxWidth && chunk) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      line = chunk;
    };

    text.split(" ").forEach(pushWord);
    if (line) lines.push(line);
    return lines;
  }

  hline(
    page: PDFPage,
    x1: number,
    x2: number,
    y: number,
    thickness: number,
    color = C.rule,
  ) {
    page.drawLine({
      start: { x: x1, y: PAGE_H - y },
      end: { x: x2, y: PAGE_H - y },
      thickness,
      color,
    });
  }

  rect(
    page: PDFPage,
    x: number,
    top: number,
    w: number,
    h: number,
    color: ReturnType<typeof rgb>,
  ) {
    page.drawRectangle({ x, y: PAGE_H - top - h, width: w, height: h, color });
  }

  roundedRect(
    page: PDFPage,
    x: number,
    top: number,
    w: number,
    h: number,
    r: number,
    opts: {
      fill?: ReturnType<typeof rgb>;
      stroke?: ReturnType<typeof rgb>;
      strokeWidth?: number;
    },
  ) {
    const rr = Math.min(r, w / 2, h / 2);
    const path =
      `M ${rr} 0 H ${w - rr} A ${rr} ${rr} 0 0 1 ${w} ${rr} V ${h - rr} ` +
      `A ${rr} ${rr} 0 0 1 ${w - rr} ${h} H ${rr} A ${rr} ${rr} 0 0 1 0 ${h - rr} ` +
      `V ${rr} A ${rr} ${rr} 0 0 1 ${rr} 0 Z`;
    page.drawSvgPath(path, {
      x,
      y: PAGE_H - top,
      color: opts.fill,
      borderColor: opts.stroke,
      borderWidth: opts.stroke ? (opts.strokeWidth ?? 1) : 0,
    });
  }

  /** A small status chip, right-aligned to rightX. Returns its width. */
  pill(
    page: PDFPage,
    label: string,
    rightX: number,
    top: number,
    color: ReturnType<typeof rgb>,
  ) {
    const size = 8.5;
    const text = this.clean(label);
    const w = this.width(text, this.fonts.semibold, size) + 18;
    const h = 18;
    const x = rightX - w;
    this.roundedRect(page, x, top, w, h, 9, {
      stroke: color,
      strokeWidth: 1.1,
    });
    this.text(page, text, x + w / 2, top + 12.4, {
      font: this.fonts.semibold,
      size,
      color,
      align: "center",
    });
    return w;
  }

  /** The store's mark: a gear with a green verified badge, matching the website. */
  logo(page: PDFPage, x: number, top: number, size: number) {
    const scale = (size * 0.88) / 24;
    const ox = x + size * 0.06;
    const oy = top + size * 0.06;
    const px = (gx: number) => ox + gx * scale;
    const py = (gy: number) => PAGE_H - (oy + gy * scale);
    const stroke = 2.4 * scale;

    const spokes: [number, number, number, number][] = [
      [11, 10.27, 7, 3.34],
      [11, 13.73, 7, 20.66],
      [12, 22, 12, 20],
      [12, 2, 12, 4],
      [14, 12, 22, 12],
      [17, 20.66, 16, 18.93],
      [17, 3.34, 16, 5.07],
      [2, 12, 4, 12],
      [20.66, 17, 18.93, 16],
      [20.66, 7, 18.93, 8],
      [3.34, 17, 5.07, 16],
      [3.34, 7, 5.07, 8],
    ];
    for (const [x1, y1, x2, y2] of spokes) {
      page.drawLine({
        start: { x: px(x1), y: py(y1) },
        end: { x: px(x2), y: py(y2) },
        thickness: stroke,
        color: C.ink,
        lineCap: LineCapStyle.Round,
      });
    }
    page.drawCircle({
      x: px(12),
      y: py(12),
      size: 2 * scale,
      borderColor: C.ink,
      borderWidth: stroke,
    });
    page.drawCircle({
      x: px(12),
      y: py(12),
      size: 8 * scale,
      borderColor: C.ink,
      borderWidth: stroke,
    });

    // Green badge with a paper-coloured ring so it sits cleanly over the gear
    const badge = size * 0.36;
    const ring = 1.6;
    const cx = x + size / 2;
    const cy = top + size / 2;
    this.roundedRect(
      page,
      cx - badge / 2 - ring,
      cy - badge / 2 - ring,
      badge + ring * 2,
      badge + ring * 2,
      badge * 0.3,
      {
        fill: C.white,
      },
    );
    this.roundedRect(
      page,
      cx - badge / 2,
      cy - badge / 2,
      badge,
      badge,
      badge * 0.22,
      { fill: C.badge },
    );

    const cs = (size * 0.2) / 24;
    const checkPoint = (gx: number, gy: number) => ({
      x: cx + (gx - 12) * cs,
      y: PAGE_H - (cy + (gy - 11.5) * cs),
    });
    const a = checkPoint(20, 6);
    const b = checkPoint(9, 17);
    const c = checkPoint(4, 12);
    for (const [s, e] of [
      [a, b],
      [b, c],
    ] as const) {
      page.drawLine({
        start: s,
        end: e,
        thickness: 4 * cs,
        color: C.white,
        lineCap: LineCapStyle.Round,
      });
    }
  }
}

// ── The receipt ──────────────────────────────────────────────────────────

const COL = {
  itemLeft: MARGIN + 8,
  amountRight: PAGE_W - MARGIN - 8,
  unitRight: PAGE_W - MARGIN - 8 - 94,
  qtyRight: PAGE_W - MARGIN - 8 - 94 - 88,
  warrantyLeft: PAGE_W - MARGIN - 8 - 94 - 88 - 34 - 64,
  warrantyWidth: 64,
};
const ITEM_WIDTH = COL.warrantyLeft - 10 - COL.itemLeft;

export function receiptFileName(
  receipt: Pick<StoredReceipt, "receiptNumber">,
): string {
  return `Receipt-${receipt.receiptNumber}.pdf`;
}

export async function renderReceiptPdf(
  receipt: StoredReceipt,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Receipt ${receipt.receiptNumber}`);
  doc.setSubject(`Receipt for ${receipt.customer.name}`);
  doc.setAuthor(RECEIPT_BUSINESS.brandName);
  doc.setCreator(RECEIPT_BUSINESS.brandName);
  doc.setProducer(RECEIPT_BUSINESS.brandName);
  doc.setCreationDate(new Date(receipt.issuedAt));
  doc.setModificationDate(new Date(receipt.issuedAt));

  const fonts = await embedFonts(doc);
  const p = new Painter(doc, fonts);
  const isVoid = receipt.status === "void";

  const pages: PDFPage[] = [];
  const newPage = () => {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    pages.push(page);
    return page;
  };

  let page = newPage();

  // ── Header ─────────────────────────────────────────────────────────────
  const drawBrandBand = (target: PDFPage) =>
    p.rect(target, 0, 0, PAGE_W, 6, C.brand);
  drawBrandBand(page);

  p.logo(page, MARGIN, 28, 36);
  p.text(page, RECEIPT_BUSINESS.brandName, MARGIN + 46, 45, {
    font: fonts.extrabold,
    size: 17.5,
  });
  p.text(page, RECEIPT_BUSINESS.tagline, MARGIN + 46, 58, {
    font: fonts.regular,
    size: 8.5,
    color: C.muted,
  });

  const detailLines = [
    `${RECEIPT_BUSINESS.legalName}  ·  CAC BN ${RECEIPT_BUSINESS.cacNumber}${RECEIPT_BUSINESS.tin ? `  ·  TIN ${RECEIPT_BUSINESS.tin}` : ""}`,
    `${RECEIPT_BUSINESS.address}  ·  ${RECEIPT_BUSINESS.phone}`,
    `${RECEIPT_BUSINESS.email}  ·  ${RECEIPT_BUSINESS.website}`,
  ];
  detailLines.forEach((line, i) => {
    p.text(page, line, MARGIN, 82 + i * 11.5, {
      font: fonts.regular,
      size: 8,
      color: C.muted,
    });
  });

  const rightX = PAGE_W - MARGIN;
  p.text(page, "Receipt", rightX, 50, {
    font: fonts.extrabold,
    size: 27,
    align: "right",
  });
  p.text(page, `No. ${receipt.receiptNumber}`, rightX, 68, {
    font: fonts.semibold,
    size: 10.5,
    align: "right",
  });
  p.text(
    page,
    `${formatReceiptDate(receipt.issuedAt)}  ·  ${formatReceiptTime(receipt.issuedAt)}`,
    rightX,
    81,
    { font: fonts.regular, size: 8.5, color: C.muted, align: "right" },
  );

  const statusLabel = isVoid
    ? "Void"
    : receipt.balance > 0
      ? "Part payment"
      : "Paid in full";
  const statusColor = isVoid ? C.red : receipt.balance > 0 ? C.brand : C.green;
  p.pill(page, statusLabel, rightX, 90, statusColor);

  p.hline(page, MARGIN, PAGE_W - MARGIN, 124, 0.8, C.rule);

  let y = 124;

  // Void notice
  if (isVoid) {
    const reason = receipt.voidReason ? ` Reason: ${receipt.voidReason}` : "";
    const message = `This receipt was voided on ${receipt.voidedAt ? formatReceiptDateTime(receipt.voidedAt) : "—"}.${reason}`;
    const lines = p.wrap(message, fonts.semibold, 9, CONTENT_W - 24);
    const h = 16 + lines.length * 12;
    p.rect(page, MARGIN, y + 12, CONTENT_W, h, hex("#fdecec"));
    lines.forEach((line, i) => {
      p.text(page, line, MARGIN + 12, y + 12 + 17 + i * 12, {
        font: fonts.semibold,
        size: 9,
        color: C.red,
      });
    });
    y += 12 + h;
  }

  // ── Customer and payment ───────────────────────────────────────────────
  y += 24;
  const colRightX = MARGIN + 292;
  const infoTop = y;

  p.text(page, "Received from", MARGIN, infoTop, {
    font: fonts.regular,
    size: 8,
    color: C.muted,
  });
  let leftY = infoTop + 16;
  p.wrap(receipt.customer.name, fonts.semibold, 12.5, 270).forEach((line) => {
    p.text(page, line, MARGIN, leftY, { font: fonts.semibold, size: 12.5 });
    leftY += 15;
  });
  const customerLines = [receipt.customer.phone, receipt.customer.email].filter(
    Boolean,
  ) as string[];
  customerLines.forEach((line) => {
    p.text(page, line, MARGIN, leftY, {
      font: fonts.regular,
      size: 9,
      color: C.muted,
    });
    leftY += 12;
  });
  if (receipt.customer.address) {
    p.wrap(receipt.customer.address, fonts.regular, 9, 270)
      .slice(0, 3)
      .forEach((line) => {
        p.text(page, line, MARGIN, leftY, {
          font: fonts.regular,
          size: 9,
          color: C.muted,
        });
        leftY += 12;
      });
  }

  p.text(page, "Payment", colRightX, infoTop, {
    font: fonts.regular,
    size: 8,
    color: C.muted,
  });
  let rightY = infoTop + 16;
  p.text(
    page,
    PAYMENT_METHOD_LABELS[receipt.paymentMethod],
    colRightX,
    rightY,
    {
      font: fonts.semibold,
      size: 11,
    },
  );
  rightY += 14;
  if (receipt.paymentReference) {
    p.wrap(
      `Ref: ${receipt.paymentReference}`,
      fonts.regular,
      9,
      CONTENT_W - 292,
    ).forEach((line) => {
      p.text(page, line, colRightX, rightY, {
        font: fonts.regular,
        size: 9,
        color: C.muted,
      });
      rightY += 12;
    });
  }
  if (receipt.servedBy) {
    p.text(page, `Served by ${receipt.servedBy}`, colRightX, rightY, {
      font: fonts.regular,
      size: 9,
      color: C.muted,
    });
    rightY += 12;
  }

  y = Math.max(leftY, rightY) + 18;

  // ── Items table ────────────────────────────────────────────────────────
  const drawTableHeader = (
    target: PDFPage,
    top: number,
    continued: boolean,
  ) => {
    p.rect(target, MARGIN, top, CONTENT_W, 24, C.tint);
    const base = top + 15.5;
    const head = { font: fonts.semibold, size: 8.5, color: C.muted };
    p.text(
      target,
      continued ? "Item (continued)" : "Item",
      COL.itemLeft,
      base,
      head,
    );
    p.text(target, "Warranty", COL.warrantyLeft, base, head);
    p.text(target, "Qty", COL.qtyRight, base, { ...head, align: "right" });
    p.text(target, "Unit price", COL.unitRight, base, {
      ...head,
      align: "right",
    });
    p.text(target, "Amount", COL.amountRight, base, {
      ...head,
      align: "right",
    });
    return top + 24;
  };

  const itemMeta = (item: ReceiptItem): string => {
    const bits: string[] = [];
    if (item.condition) bits.push(ITEM_CONDITION_LABELS[item.condition]);
    if (item.serial) bits.push(`S/N ${item.serial}`);
    return bits.join("  ·  ");
  };

  y = drawTableHeader(page, y, false);

  receipt.items.forEach((item) => {
    const descLines = p.wrap(item.description, fonts.semibold, 9.5, ITEM_WIDTH);
    const metaLines = p.wrap(itemMeta(item), fonts.regular, 8, ITEM_WIDTH);
    const warrantyLines = p.wrap(
      item.warranty ?? "",
      fonts.regular,
      8.5,
      COL.warrantyWidth,
    );

    const leftHeight =
      descLines.length * 12.5 +
      (metaLines.length ? 2 + metaLines.length * 10.5 : 0);
    const rowHeight = Math.max(leftHeight, warrantyLines.length * 11) + 18;

    if (y + rowHeight > CONTENT_BOTTOM) {
      page = newPage();
      drawBrandBand(page);
      p.text(page, RECEIPT_BUSINESS.brandName, MARGIN, 34, {
        font: fonts.extrabold,
        size: 11,
      });
      p.text(page, `Receipt ${receipt.receiptNumber}`, PAGE_W - MARGIN, 34, {
        font: fonts.semibold,
        size: 9.5,
        color: C.muted,
        align: "right",
      });
      y = drawTableHeader(page, 52, true);
    }

    descLines.forEach((line, i) => {
      p.text(page, line, COL.itemLeft, y + 15 + i * 12.5, {
        font: fonts.semibold,
        size: 9.5,
      });
    });
    const metaStart = y + 15 + (descLines.length - 1) * 12.5 + 12;
    metaLines.forEach((line, i) => {
      p.text(page, line, COL.itemLeft, metaStart + i * 10.5, {
        font: fonts.regular,
        size: 8,
        color: C.muted,
      });
    });
    warrantyLines.forEach((line, i) => {
      p.text(page, line, COL.warrantyLeft, y + 15 + i * 11, {
        font: fonts.regular,
        size: 8.5,
        color: C.muted,
      });
    });
    if (!warrantyLines.length) {
      p.text(page, "—", COL.warrantyLeft, y + 15, {
        font: fonts.regular,
        size: 8.5,
        color: C.faint,
      });
    }

    p.text(page, String(item.quantity), COL.qtyRight, y + 15, {
      font: fonts.regular,
      size: 9.5,
      align: "right",
    });
    p.text(page, p.money(item.unitPrice), COL.unitRight, y + 15, {
      font: fonts.regular,
      size: 9.5,
      align: "right",
    });
    p.text(page, p.money(item.lineTotal), COL.amountRight, y + 15, {
      font: fonts.semibold,
      size: 9.5,
      align: "right",
    });

    y += rowHeight;
    p.hline(page, MARGIN, PAGE_W - MARGIN, y, 0.6, C.rule);
  });

  // ── Totals, amount in words, notes ─────────────────────────────────────
  const totalsRows = 2 + (receipt.discount > 0 ? 1 : 0) + 2; // subtotal, [discount], total, paid, balance
  const totalsHeight = 28 + totalsRows * 17 + 14;
  const wordsLines = p.wrap(
    amountInWords(receipt.total),
    fonts.semibold,
    9.5,
    258,
  );
  const noteLines = p.wrap(receipt.notes ?? "", fonts.regular, 9, 258);
  const leftBlockHeight =
    (wordsLines.length ? 14 + wordsLines.length * 13 : 0) +
    (noteLines.length ? 26 + noteLines.length * 12 : 0);
  const needed = Math.max(totalsHeight, leftBlockHeight) + 150; // leaves room for signatures and thanks

  if (y + needed > CONTENT_BOTTOM) {
    page = newPage();
    drawBrandBand(page);
    p.text(page, RECEIPT_BUSINESS.brandName, MARGIN, 34, {
      font: fonts.extrabold,
      size: 11,
    });
    p.text(page, `Receipt ${receipt.receiptNumber}`, PAGE_W - MARGIN, 34, {
      font: fonts.semibold,
      size: 9.5,
      color: C.muted,
      align: "right",
    });
    y = 44;
  }

  const blockTop = y + 24;

  // left: words + notes
  let wy = blockTop;
  if (wordsLines.length) {
    p.text(page, "Amount in words", MARGIN, wy, {
      font: fonts.regular,
      size: 8,
      color: C.muted,
    });
    wy += 14;
    wordsLines.forEach((line) => {
      p.text(page, line, MARGIN, wy, { font: fonts.semibold, size: 9.5 });
      wy += 13;
    });
  }
  if (noteLines.length) {
    wy += 12;
    p.text(page, "Notes", MARGIN, wy, {
      font: fonts.regular,
      size: 8,
      color: C.muted,
    });
    wy += 14;
    noteLines.forEach((line) => {
      p.text(page, line, MARGIN, wy, {
        font: fonts.regular,
        size: 9,
        color: C.ink,
      });
      wy += 12;
    });
  }

  // right: figures
  const labelX = PAGE_W - MARGIN - 232;
  const valueX = PAGE_W - MARGIN - 8;
  let ty = blockTop;
  const row = (
    label: string,
    value: string,
    opts?: { bold?: boolean; color?: ReturnType<typeof rgb> },
  ) => {
    p.text(page, label, labelX + 8, ty, {
      font: opts?.bold ? fonts.semibold : fonts.regular,
      size: 9.5,
      color: opts?.color ?? C.muted,
    });
    p.text(page, value, valueX, ty, {
      font: opts?.bold ? fonts.semibold : fonts.regular,
      size: 9.5,
      color: opts?.color ?? C.ink,
      align: "right",
    });
    ty += 17;
  };

  row("Subtotal", p.money(receipt.subtotal));
  if (receipt.discount > 0) row("Discount", `-${p.money(receipt.discount)}`);

  ty += 2;
  p.hline(page, labelX, PAGE_W - MARGIN, ty - 11, 1.4, C.ink);
  ty += 9;
  p.text(page, "Total", labelX + 8, ty, { font: fonts.extrabold, size: 12.5 });
  p.text(page, p.money(receipt.total), valueX, ty, {
    font: fonts.extrabold,
    size: 15,
    align: "right",
  });
  ty += 22;

  row("Amount paid", p.money(receipt.amountPaid), { bold: true, color: C.ink });
  if (receipt.balance > 0) {
    p.roundedRect(page, labelX, ty - 12.5, 232, 22, 4, {
      fill: hex("#fbeee4"),
    });
    p.text(page, "Balance due", labelX + 8, ty + 2, {
      font: fonts.semibold,
      size: 10,
      color: C.brand,
    });
    p.text(page, p.money(receipt.balance), valueX, ty + 2, {
      font: fonts.extrabold,
      size: 11.5,
      color: C.brand,
      align: "right",
    });
    ty += 24;
  } else {
    row("Balance due", p.money(0), { color: C.muted });
  }

  y = Math.max(wy, ty) + 14;

  // ── Signatures and thanks ──────────────────────────────────────────────
  // Sit just above the footer when there is room, so a short receipt still
  // looks composed instead of ending halfway down the page.
  y = Math.max(y + 34, CONTENT_BOTTOM - 84);
  const sigWidth = 188;
  p.hline(page, MARGIN, MARGIN + sigWidth, y, 0.8, C.faint);
  p.text(page, "Customer's signature", MARGIN, y + 12, {
    font: fonts.regular,
    size: 8,
    color: C.muted,
  });
  const sigRightX = PAGE_W - MARGIN - sigWidth;
  p.hline(page, sigRightX, PAGE_W - MARGIN, y, 0.8, C.faint);
  p.text(
    page,
    receipt.servedBy
      ? `For ${RECEIPT_BUSINESS.brandName}  ·  ${receipt.servedBy}`
      : `For ${RECEIPT_BUSINESS.brandName}`,
    sigRightX,
    y + 12,
    { font: fonts.regular, size: 8, color: C.muted },
  );

  y += 44;
  p.text(
    page,
    `Thank you for shopping with ${RECEIPT_BUSINESS.brandName}.`,
    PAGE_W / 2,
    y,
    {
      font: fonts.semibold,
      size: 10.5,
      align: "center",
    },
  );
  p.text(
    page,
    `Questions or a warranty claim? WhatsApp ${RECEIPT_BUSINESS.phone} or email ${RECEIPT_BUSINESS.email}.`,
    PAGE_W / 2,
    y + 14,
    { font: fonts.regular, size: 8.5, color: C.muted, align: "center" },
  );

  // ── Footer and watermark on every page ─────────────────────────────────
  const total = pages.length;
  pages.forEach((target, index) => {
    p.hline(target, MARGIN, PAGE_W - MARGIN, FOOTER_RULE_TOP, 0.6, C.rule);
    const legal = p.wrap(
      "Keep this receipt as your proof of purchase. Warranty and returns follow the policies published at " +
        `${RECEIPT_BUSINESS.website}/policies/warranty and ${RECEIPT_BUSINESS.website}/policies/returns.`,
      fonts.regular,
      7.5,
      360,
    );
    legal.forEach((line, i) => {
      p.text(target, line, MARGIN, FOOTER_RULE_TOP + 14 + i * 10, {
        font: fonts.regular,
        size: 7.5,
        color: C.muted,
      });
    });
    p.text(
      target,
      `${RECEIPT_BUSINESS.legalName}  ·  CAC BN ${RECEIPT_BUSINESS.cacNumber}`,
      MARGIN,
      FOOTER_RULE_TOP + 14 + legal.length * 10 + 2,
      { font: fonts.regular, size: 7.5, color: C.faint },
    );
    p.text(
      target,
      receipt.receiptNumber,
      PAGE_W - MARGIN,
      FOOTER_RULE_TOP + 14,
      {
        font: fonts.semibold,
        size: 8,
        align: "right",
      },
    );
    p.text(
      target,
      `Page ${index + 1} of ${total}`,
      PAGE_W - MARGIN,
      FOOTER_RULE_TOP + 25,
      {
        font: fonts.regular,
        size: 8,
        color: C.muted,
        align: "right",
      },
    );

    if (isVoid) {
      const size = 150;
      const word = "VOID";
      const w = fonts.extrabold.widthOfTextAtSize(word, size);
      const angle = 35;
      const rad = (angle * Math.PI) / 180;
      const capHeight = size * 0.72;
      // Place the rotated word so its centre lands on the middle of the page
      const cx = PAGE_W / 2;
      const cy = PAGE_H / 2;
      const x = cx - (w / 2) * Math.cos(rad) + (capHeight / 2) * Math.sin(rad);
      const yy = cy - (w / 2) * Math.sin(rad) - (capHeight / 2) * Math.cos(rad);
      target.drawText(word, {
        x,
        y: yy,
        size,
        font: fonts.extrabold,
        color: C.red,
        opacity: 0.12,
        rotate: degrees(angle),
      });
    }
  });

  return doc.save();
}
