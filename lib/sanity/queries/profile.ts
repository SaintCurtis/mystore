import { defineQuery } from "next-sanity";

/**
 * Full engagement bundle for the Profile page: birthday/notification
 * settings, the synced wishlist (with live product data), and recent
 * search history. Used server-side on page load and again by the
 * birthday cron job (fetched separately there — see queries/cron.ts).
 */
export const CUSTOMER_PROFILE_QUERY = defineQuery(`*[
  _type == "customer" && clerkUserId == $clerkUserId
][0]{
  _id,
  name,
  email,
  phones,
  birthday,
  birthdayReminders,
  birthdaySmsOptIn,
  "wishlist": wishlist[]->{
    _id,
    name,
    "slug": slug.current,
    price,
    "image": images[0].asset->url,
    "categoryTitle": category->title,
    stock
  },
  "searchHistory": searchHistory[] | order(searchedAt desc) [0...40]{ searchTerm, searchedAt }
}`);

/**
 * A customer's open (non-cancelled) layaway plans, newest first, with
 * product snapshot and full payment history for the progress bar.
 */
export const LAYAWAY_PLANS_BY_USER_QUERY = defineQuery(`*[
  _type == "layawayPlan"
  && clerkUserId == $clerkUserId
  && status != "cancelled"
] | order(startedAt desc) {
  _id,
  planNumber,
  status,
  totalAmount,
  amountPaid,
  paceMonths,
  startedAt,
  priceLockExpiresAt,
  nextPaymentReminderAt,
  "product": product->{ _id, name, "slug": slug.current, "image": images[0].asset->url },
  "resultingOrderId": resultingOrder->_id,
  "payments": payments[] | order(paidAt desc){ amount, paidAt, paystackReference }
}`);

/**
 * Idempotency check for the Paystack webhook — has this reference already
 * been recorded against any layaway plan?
 */
export const LAYAWAY_PLAN_BY_PAYSTACK_REFERENCE_QUERY = defineQuery(`*[
  _type == "layawayPlan" && $reference in payments[].paystackReference
][0]{ _id }`);

/**
 * One specific layaway plan owned by a user — used to validate a top-up
 * payment before initializing a new Paystack transaction against it.
 */
export const LAYAWAY_PLAN_BY_ID_QUERY = defineQuery(`*[
  _type == "layawayPlan" && _id == $id && clerkUserId == $clerkUserId
][0]{
  _id,
  status,
  totalAmount,
  amountPaid,
  "productId": product->_id,
  "productName": product->name,
  "paystackReferences": payments[].paystackReference
}`);
