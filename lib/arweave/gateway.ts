import { isArweaveURL } from "./arweave";
import { isNormalizeableIPFSUrl, normalizeIPFSUrl } from "./ipfs";

const IPFS_GATEWAY = "https://magic.decentralized-content.com";

const ARWEAVE_GATEWAY = "https://arweave.net";

/**
 * Returns the fetchable URL for an Arweave URL.
 *
 * @param normalizedArweaveUrl - The normalized Arweave URL.
 * @returns The fetchable URL.
 */
export function arweaveGatewayUrl(normalizedArweaveUrl: string | null) {
  if (!normalizedArweaveUrl || typeof normalizedArweaveUrl !== "string") return null;
  return normalizedArweaveUrl.replace("ar://", `${ARWEAVE_GATEWAY}/`);
}

/**
 * Returns the fetchable URL for an IPFS URL.
 *
 * @param url - The IPFS URL.
 * @returns The fetchable URL.
 */
export function ipfsGatewayUrl(url: string | null) {
  if (!url || typeof url !== "string") return null;
  const normalizedIPFSUrl = normalizeIPFSUrl(url);
  if (normalizedIPFSUrl) {
    return normalizedIPFSUrl.replace("ipfs://", `${IPFS_GATEWAY}/ipfs/`);
  }
  return null;
}

/**
 * Returns the fetchable URL for a URI.
 *
 * @param uri - The URI.
 * @returns The fetchable URL.
 */
export function getFetchableUrl(uri: string | null | undefined): string | null {
  if (!uri || typeof uri !== "string") return null;

  // Prevent fetching from insecure URLs
  if (uri.startsWith("http://")) return null;

  // If it is an IPFS HTTP or ipfs:// url
  if (isNormalizeableIPFSUrl(uri)) {
    // Return a fetchable gateway url
    return ipfsGatewayUrl(uri);
  }

  // If it is a ar:// url
  if (isArweaveURL(uri)) {
    // Return a fetchable gateway url
    return arweaveGatewayUrl(uri);
  }

  // If it is already a url (or blob or data-uri)
  if (/^(https|data|blob):/.test(uri)) {
    // Return the URI
    return uri;
  }

  return null;
}
