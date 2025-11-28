import { isNormalizedIPFSURL } from "./isNormalizedIPFSURL";

/**
 * Checks if a URL is a gateway IPFS URL.
 *
 * @param url - The URL to check.
 * @returns True if the URL is a gateway IPFS URL, false otherwise.
 */
export function isGatewayIPFSUrl(url: string | null | undefined): boolean {
  if (url && typeof url === "string") {
    try {
      const parsed = new URL(url.replace(/^"|'(.*)"|'$/, "$1"));
      return !isNormalizedIPFSURL(url) && parsed && parsed.pathname.startsWith("/ipfs/");
    } catch {
      return false;
    }
  }

  return false;
}

