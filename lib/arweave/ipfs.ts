import { CID } from "multiformats/cid";

export type IPFSUrl = `ipfs://${string}`;

/**
 * Checks if a string is a CID.
 *
 * @param str - The string to check.
 * @returns True if the string is a CID, false otherwise.
 */
export function isCID(str: string | null | undefined): boolean {
  if (!str) return false;

  try {
    CID.parse(str);
    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    if (/^(bafy|Qm)/.test(str)) return true;
    return false;
  }
}

/**
 * Normalizes an IPFS URL.
 *
 * @param url - The IPFS URL to normalize.
 * @returns The normalized IPFS URL.
 */
export function normalizeIPFSUrl(url: string | null | undefined): IPFSUrl | null {
  if (!url || typeof url !== "string") return null;

  // Handle urls wrapped in quotes
  url = url.replace(/"/g, "");

  // Check if already a normalized IPFS url
  if (isNormalizedIPFSURL(url)) return url as IPFSUrl;

  // Check if url is a CID string
  if (isCID(url)) return `ipfs://${url}`;

  // If url is not either an ipfs gateway or protocol url
  if (!isIPFSUrl(url)) return null;

  // If url is already a gateway url, parse and normalize
  if (isGatewayIPFSUrl(url)) {
    // Replace leading double-slashes and parse URL
    const parsed = new URL(url.replace(/^\/\//, "http://"));
    // Remove IPFS from the URL
    // http://gateway/ipfs/<CID>?x=y#z -> http://gateway/<CID>?x=y#z
    parsed.pathname = parsed.pathname.replace(/^\/ipfs\//, "");
    // Remove the protocol and host from the URL
    // http://gateway/<CID>?x=y#z -> <CID>?x=y#z
    const cid = parsed.toString().replace(`${parsed.protocol}//${parsed.host}/`, "");
    // Prepend ipfs protocol
    return `ipfs://${cid}`;
  }

  return null;
}

/**
 * Checks if a URL is a normalized IPFS URL.
 *
 * @param url - The URL to check.
 * @returns True if the URL is a normalized IPFS URL, false otherwise.
 */
function isNormalizedIPFSURL(url: string | null | undefined): boolean {
  return url && typeof url === "string" ? url.startsWith("ipfs://") : false;
}

/**
 * Checks if a URL is a gateway IPFS URL.
 *
 * @param url - The URL to check.
 * @returns True if the URL is a gateway IPFS URL, false otherwise.
 */
function isGatewayIPFSUrl(url: string | null | undefined): boolean {
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

/**
 * Checks if a URL is a IPFS URL.
 *
 * @param url - The URL to check.
 * @returns True if the URL is a IPFS URL, false otherwise.
 */
function isIPFSUrl(url: string | null | undefined): boolean {
  return url ? isNormalizedIPFSURL(url) || isGatewayIPFSUrl(url) : false;
}

/**
 * Checks if a URL is a normalizeable IPFS URL.
 *
 * @param url - The URL to check.
 * @returns True if the URL is a normalizeable IPFS URL, false otherwise.
 */
export function isNormalizeableIPFSUrl(url: string | null | undefined): boolean {
  return url ? isIPFSUrl(url) || isCID(url) : false;
}
