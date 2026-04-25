import { defineQuery } from "next-sanity";

export const REFERRAL_BY_USER_QUERY = defineQuery(`*[
  _type == "referral"
  && clerkUserId == $clerkUserId
][0] {
  _id,
  clerkUserId,
  email,
  name,
  code,
  clicks,
  conversions,
  totalEarned,
  createdAt
}`);

export const REFERRAL_CLICKS_BY_CODE_QUERY = defineQuery(`*[
  _type == "referralClick"
  && code == $code
] | order(clickedAt desc) [0...20] {
  _id,
  code,
  converted,
  convertedOrderId,
  clickedAt
}`);

export const REFERRAL_LEADERBOARD_QUERY = defineQuery(`*[
  _type == "referral"
  && conversions > 0
] | order(conversions desc) [0...10] {
  _id,
  name,
  code,
  conversions,
  totalEarned
}`);