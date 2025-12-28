/**
 * URL-Parameter-Management für Connection-String und Table-Name
 * 
 * WICHTIG: React Router basename ist /aztv
 * URLs sind daher: /aztv/ oder /aztv/{table}?connection=...
 */

export interface UrlParams {
  connection?: string;
  table?: string;
}

const BASE_PATH = "/aztv";

/**
 * Liest Query-Parameter aus der URL
 */
export function getUrlParams(): UrlParams {
  const params = new URLSearchParams(globalThis.location.search);
  const path = globalThis.location.pathname || "/";

  // Remove base path to get relative path
  const relativePath = path.startsWith(BASE_PATH) 
    ? path.substring(BASE_PATH.length) 
    : path;
  
  const segments = relativePath.split("/").filter(Boolean);
  const table = segments.length > 0 ? decodeURIComponent(segments[0]) : undefined;

  return {
    connection: params.get("connection") || undefined,
    table,
  };
}

/**
 * Setzt Query-Parameter in der URL
 * Nutzt replaceState um History nicht zu füllen
 * 
 * Baut absolute URL mit BASE_PATH Prefix
 */
export function setUrlParams(params: UrlParams): void {
  const searchParams = new URLSearchParams(globalThis.location.search);

  if (params.connection) {
    searchParams.set("connection", params.connection);
  } else {
    searchParams.delete("connection");
  }

  // Build absolute path with base
  const pathname = params.table 
    ? `${BASE_PATH}/${encodeURIComponent(params.table)}` 
    : `${BASE_PATH}/`;

  const query = searchParams.toString();
  const newUrl = query ? `${pathname}?${query}` : pathname;
  
  globalThis.history.replaceState(null, "", newUrl);
}
