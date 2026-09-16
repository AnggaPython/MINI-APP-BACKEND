import * as crypto from "crypto";

/**
 * Daily drop code derivation — single source of truth for BOTH the announcer
 * (`bot.service.ts`, which posts the code into the channel) and the validator
 * (`users.service.ts#claimCodeDrop`).
 *
 * Why this exists: the code used to be `ELIX-${YYYYMMDD}`, a pure function of the
 * calendar date and therefore derivable by anyone. A scheduled bot could claim
 * one of the 50 daily slots the instant the 12:00 UTC window opened, before real
 * players ever saw the post (audit finding
 * users.drop-code-derived-from-date).
 *
 * Behaviour:
 *   - `DROP_CODE_SECRET` set   → `ELIX-` + HMAC-SHA256(secret, date)[0..10]
 *     (unguessable without the server secret).
 *   - `DROP_CODE_SECRET` unset → the legacy date-only code, so an existing
 *     deployment keeps working. Set the variable and redeploy to close the
 *     finding; both sides move together because they share this function.
 */
export function deriveDailyCode(now: Date = new Date()): string {
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ""); // e.g. 20260807
  const secret = process.env.DROP_CODE_SECRET;
  if (!secret) {
    return `ELIX-${dateStr}`;
  }
  const digest = crypto
    .createHmac("sha256", secret)
    .update(dateStr)
    .digest("hex");
  return `ELIX-${digest.slice(0, 10).toUpperCase()}`;
}

/** True when the deployment has opted into the unguessable derivation. */
export function dailyCodeIsSecretDerived(): boolean {
  return Boolean(process.env.DROP_CODE_SECRET);
}
