/**
 * Business details printed on every receipt and receipt email.
 *
 * Edit the constants below for anything that is fixed. Two details are not
 * shown anywhere on the public site, so they come from optional environment
 * variables instead (set them in Vercel -> Settings -> Environment Variables):
 *
 *   RECEIPT_BUSINESS_ADDRESS   shop / office address printed under the logo
 *   RECEIPT_BUSINESS_TIN       tax identification number (line is hidden if empty)
 *
 * Optional email settings:
 *
 *   RECEIPT_FROM_EMAIL   defaults to RESEND_FROM_EMAIL, then notifications@buyfromsaint.com
 *   RECEIPT_REPLY_TO     defaults to updates@buyfromsaint.com
 *   RECEIPT_BCC_EMAIL    if set, you get a private copy of every receipt emailed
 */

export const RECEIPT_BUSINESS = {
  brandName: "The Saint's TechNet",
  legalName: "The Saint's Technology Networks",
  tagline: "Engineer-Verified. Community-Trusted.",
  cacNumber: "9245886",
  address: process.env.RECEIPT_BUSINESS_ADDRESS?.trim() || "Lagos, Nigeria",
  tin: process.env.RECEIPT_BUSINESS_TIN?.trim() || "",
  phone: "+234 906 089 8951",
  whatsappDigits: "2349060898951",
  email: "updates@buyfromsaint.com",
  website: "buyfromsaint.com",
  websiteUrl: "https://www.buyfromsaint.com",
} as const;

export const RECEIPT_NUMBER_PREFIX = "STN";

export function receiptFromEmail(): string {
  return (
    process.env.RECEIPT_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    "The Saint's TechNet <notifications@buyfromsaint.com>"
  );
}

export function receiptReplyTo(): string {
  return process.env.RECEIPT_REPLY_TO || RECEIPT_BUSINESS.email;
}

export function receiptBccEmail(): string | undefined {
  return process.env.RECEIPT_BCC_EMAIL?.trim() || undefined;
}
