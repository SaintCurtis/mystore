/**
 * Money helpers for receipts. Everything is whole naira (the store prices in
 * whole naira), so all the maths is integer maths and totals are exact.
 * Pure functions: used by the form (live totals) and by the server (the
 * authoritative numbers), which is why they live in one place.
 */

export interface TotalsInput {
  quantity: number;
  unitPrice: number;
}

export interface Totals {
  lineTotals: number[];
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  balance: number;
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

/**
 * @param amountPaid  omit (or pass null) to mean "paid in full"
 */
export function computeTotals(
  items: TotalsInput[],
  discount: number = 0,
  amountPaid?: number | null,
): Totals {
  const lineTotals = items.map(
    (item) => Math.round(item.quantity) * Math.round(item.unitPrice),
  );
  const subtotal = lineTotals.reduce((sum, n) => sum + n, 0);
  const safeDiscount = clamp(Math.round(discount || 0), 0, subtotal);
  const total = subtotal - safeDiscount;
  const paid =
    amountPaid == null ? total : clamp(Math.round(amountPaid), 0, total);
  return {
    lineTotals,
    subtotal,
    discount: safeDiscount,
    total,
    amountPaid: paid,
    balance: total - paid,
  };
}

/** 4350000 -> "₦4,350,000" */
export function formatNaira(amount: number): string {
  const rounded = Math.round(amount || 0);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}₦${Math.abs(rounded).toLocaleString("en-NG")}`;
}

const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];
const SCALES = ["", "thousand", "million", "billion"];

function belowHundred(n: number): string {
  if (n < 20) return ONES[n];
  const tens = TENS[Math.floor(n / 10)];
  const unit = n % 10;
  return unit ? `${tens}-${ONES[unit]}` : tens;
}

function belowThousand(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (!hundreds) return belowHundred(rest);
  const head = `${ONES[hundreds]} hundred`;
  return rest ? `${head} and ${belowHundred(rest)}` : head;
}

/**
 * 4350000 -> "Four million, three hundred and fifty thousand naira only"
 * Uses the British "and" that Nigerian receipts use. Supports up to
 * 999,999,999,999; larger numbers return an empty string (the receipt then
 * simply omits the words line).
 */
export function amountInWords(amount: number): string {
  const n = Math.round(amount || 0);
  if (n < 0 || n > 999_999_999_999) return "";
  if (n === 0) return "Zero naira only";

  const groups: { value: number; scale: string }[] = [];
  let rest = n;
  for (let i = 0; rest > 0; i++) {
    groups.unshift({ value: rest % 1000, scale: SCALES[i] });
    rest = Math.floor(rest / 1000);
  }

  const parts: string[] = [];
  groups.forEach((group, index) => {
    if (group.value === 0) return;
    let words = belowThousand(group.value);
    if (group.scale) words += ` ${group.scale}`;
    // "one thousand and five", "one million and fifty": a bare final group
    // under one hundred is joined with "and" instead of a comma.
    const isLast = index === groups.length - 1;
    if (isLast && parts.length > 0 && group.value < 100) words = `and ${words}`;
    parts.push(words);
  });

  let sentence = parts.join(", ").replace(", and ", " and ");
  sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  return `${sentence} naira only`;
}
