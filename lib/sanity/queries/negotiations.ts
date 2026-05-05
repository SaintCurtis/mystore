import { groq } from "next-sanity";

// All active sessions — ordered by alert first, then latest activity
export const NEGOTIATION_SESSIONS_QUERY = groq`*[
  _type == "negotiationSession"
] | order(closeBidAlert desc, lastActivityAt desc) {
  _id,
  sessionId,
  productName,
  productSlug,
  listedPrice,
  floorPrice,
  customerBid,
  agreedPrice,
  status,
  closeBidAlert,
  startedAt,
  lastActivityAt,
  "messageCount": count(messages),
  "lastMessage": messages[-1] {
    role,
    content,
    sender,
    timestamp,
  },
}`;

// Single session with full messages
export const NEGOTIATION_SESSION_BY_ID_QUERY = groq`*[
  _type == "negotiationSession"
  && sessionId == $sessionId
][0] {
  _id,
  sessionId,
  productName,
  productSlug,
  listedPrice,
  floorPrice,
  customerBid,
  agreedPrice,
  status,
  closeBidAlert,
  startedAt,
  lastActivityAt,
  messages[] {
    role,
    content,
    sender,
    timestamp,
  },
}`;

// Dashboard stat — count of sessions needing attention
export const NEGOTIATION_ALERT_COUNT_QUERY = groq`count(*[
  _type == "negotiationSession"
  && closeBidAlert == true
  && status == "ai_active"
])`;