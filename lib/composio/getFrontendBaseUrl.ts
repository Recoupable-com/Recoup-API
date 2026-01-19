/**
 * Frontend base URL for the test environment.
 * Follows same pattern as API: test-recoup-api -> test-recoup-chat
 */
const TEST_FRONTEND_URL = "https://test-recoup-chat.vercel.app";

/**
 * Get the base URL for the frontend based on environment.
 *
 * Why: Different environments (production, test, preview, local) need different URLs
 * for OAuth callbacks and other frontend redirects.
 *
 * - Production: Uses the canonical chat.recoupable.com domain
 * - Test branch: Uses the test frontend deployment
 * - Preview (Vercel): Uses VERCEL_URL for deployment-specific URL
 * - Local: Falls back to localhost:3000 (Recoup-Chat frontend port)
 *
 * @returns The frontend base URL (e.g., "https://chat.recoupable.com")
 */
export function getFrontendBaseUrl(): string {
  // Production environment
  if (process.env.VERCEL_ENV === "production") {
    return "https://chat.recoupable.com";
  }

  // Test branch deployment - uses stable test frontend
  // VERCEL_GIT_COMMIT_REF contains the branch name on Vercel
  if (process.env.VERCEL_GIT_COMMIT_REF === "test") {
    return TEST_FRONTEND_URL;
  }

  // Vercel preview deployments - use the deployment URL
  // VERCEL_URL doesn't include protocol, so we prepend https://
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Local development fallback - Recoup-Chat runs on port 3000
  return "http://localhost:3000";
}
