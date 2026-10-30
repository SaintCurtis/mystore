/**
 * Durable limit on PIN attempts.
 *
 * The old limiter lived in a Map inside the server process, which resets on
 * every cold start and isn't shared between the many instances Vercel runs,
 * so someone firing guesses in parallel could get far more than five tries.
 * A 6-digit PIN only has a million combinations, so that matters.
 *
 * This version keeps one counter document in Sanity and bumps it *before*
 * the PIN is checked, using Sanity's atomic `inc`. Because every attempt is
 * counted first, a burst of simultaneous requests can't sneak past: only the
 * first MAX_ATTEMPTS requests in a window ever reach the PIN comparison.
 * A correct PIN resets the counter.
 *
 * The document id contains a dot ("adminAuth.lockout"), which Sanity treats
 * as private, so it is never readable without a token.
 *
 * If Sanity can't be reached we fail open (the per-IP limiter in the route
 * still applies) so a network blip can't lock you out of your own admin.
 *
 * To clear a lock by hand: delete the document with id adminAuth.lockout
 * from Vision in the Studio, or just wait for the window to end.
 */

import { writeClient } from "@/sanity/lib/client";

const DOC_ID = "adminAuth.lockout";
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Sanity's client waits up to 5 minutes by default. A PIN screen must never
// hang on the limiter, so every call here gives up (and fails open) after this.
const LIMITER_TIMEOUT_MS = 4000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number = LIMITER_TIMEOUT_MS,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

interface LockDoc {
  attempts?: number;
  windowStartedAt?: string;
}

export interface AttemptReservation {
  allowed: boolean;
  retryAfterSeconds: number;
}

async function reserveInDatabase(now: number): Promise<AttemptReservation> {
  await writeClient.createIfNotExists({
    _id: DOC_ID,
    _type: "adminAuthState",
    attempts: 0,
    windowStartedAt: new Date(now).toISOString(),
  });

  const doc = await writeClient
    .patch(DOC_ID)
    .inc({ attempts: 1 })
    .commit<LockDoc>();

  const startedAt = Date.parse(doc.windowStartedAt ?? "");
  if (!Number.isFinite(startedAt) || now - startedAt >= WINDOW_MS) {
    // The previous window is over: open a new one and count this as attempt #1.
    await writeClient
      .patch(DOC_ID)
      .set({ attempts: 1, windowStartedAt: new Date(now).toISOString() })
      .commit();
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if ((doc.attempts ?? 0) > MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((startedAt + WINDOW_MS - now) / 1000),
      ),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function reserveAttempt(
  now: number = Date.now(),
): Promise<AttemptReservation> {
  try {
    return await withTimeout(reserveInDatabase(now));
  } catch (err) {
    console.error(
      "[admin-lockout] could not reserve attempt (failing open):",
      err,
    );
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

/** Call after a correct PIN so the owner never pays for earlier mistakes. */
export async function resetAttempts(now: number = Date.now()): Promise<void> {
  try {
    await withTimeout(
      writeClient
        .patch(DOC_ID)
        .set({ attempts: 0, windowStartedAt: new Date(now).toISOString() })
        .commit(),
    );
  } catch (err) {
    console.error("[admin-lockout] could not reset counter:", err);
  }
}
