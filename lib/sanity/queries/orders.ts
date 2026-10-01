import { defineQuery } from "next-sanity";

/**
 * Get orders by Clerk user ID
 * Used on orders list page
 */
export const ORDERS_BY_USER_QUERY = defineQuery(`*[
  _type == "order"
  && clerkUserId == $clerkUserId
] | order(createdAt desc) {
  _id,
  orderNumber,
  total,
  status,
  createdAt,
  "itemCount": count(items),
  "itemNames": items[].product->name,
  "itemImages": items[].product->images[0].asset->url
}`);

/**
 * Get single order by ID with full details
 * Used on order detail page
 */
export const ORDER_BY_ID_QUERY = defineQuery(`*[
  _type == "order"
  && _id == $id
][0] {
  _id,
  orderNumber,
  clerkUserId,
  email,
  items[]{
    _key,
    quantity,
    priceAtPurchase,
    product->{
      _id,
      name,
      "slug": slug.current,
      "image": images[0]{
        asset->{
          _id,
          url
        }
      }
    }
  },
  total,
  status,
  address{
    name,
    line1,
    line2,
    city,
    postcode,
    country
  },
  paystackReference,
  createdAt
}`);

/**
 * Get recent orders (for admin dashboard)
 */
export const RECENT_ORDERS_QUERY = defineQuery(`*[
  _type == "order"
] | order(createdAt desc) [0...$limit] {
  _id,
  orderNumber,
  email,
  total,
  status,
  createdAt
}`);

/**
 * Check if order exists by Paystack reference
 * Used for webhook idempotency check
 */
export const ORDER_BY_PAYSTACK_REFERENCE_QUERY = defineQuery(`*[
  _type == "order"
  && paystackReference == $paystackReference
][0]{ _id }`);

/**
 * Full order detail by Paystack reference — used by the checkout success
 * page as the PRIMARY source of truth. The webhook that creates this
 * document is server-to-server and already payment-verified by the time
 * it exists, so finding an order here is strictly more reliable than the
 * success page re-verifying against the live Paystack API itself (which
 * depends on the customer's own browser session still matching, and can
 * briefly race the webhook on timing).
 */
export const ORDER_BY_PAYSTACK_REFERENCE_DETAIL_QUERY = defineQuery(`*[
  _type == "order"
  && paystackReference == $paystackReference
][0]{
  _id,
  orderNumber,
  clerkUserId,
  email,
  buyerName,
  items[]{
    _key,
    quantity,
    priceAtPurchase,
    product->{ _id, name }
  },
  total,
  subtotal,
  shippingFee,
  shippingMethod,
  status,
  address,
  paystackReference,
  isNegotiatedDeal,
  agreedPrice,
  createdAt
}`);