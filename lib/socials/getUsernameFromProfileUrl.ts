/**
 * Extracts username from a profile URL.
 * Uses URL parsing for robustness, with fallback to string splitting.
 *
 * @param profileUrl - The profile URL to extract username from (can be null or undefined)
 * @returns The extracted username, or empty string if not found
 */
export function getUsernameFromProfileUrl(profileUrl: string | null | undefined): string {
  if (!profileUrl) {
    return "";
  }

  try {
    const url = new URL(profileUrl);
    const pathParts = url.pathname.split("/").filter(Boolean);
    return pathParts[pathParts.length - 1] || "";
  } catch {
    // If URL parsing fails, try to extract from the end of the string
    const parts = profileUrl.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  }
}
