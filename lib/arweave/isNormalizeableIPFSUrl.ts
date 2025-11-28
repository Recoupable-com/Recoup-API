import { isCID } from "./isCID";
import { isIPFSUrl } from "./isIPFSUrl";

/**
 * Checks if a URL is a normalizeable IPFS URL.
 *
 * @param url - The URL to check.
 * @returns True if the URL is a normalizeable IPFS URL, false otherwise.
 */
export function isNormalizeableIPFSUrl(url: string | null | undefined): boolean {
  return url ? isIPFSUrl(url) || isCID(url) : false;
}

