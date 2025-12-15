/**
 * URL-Parameter-Management für Connection-String und Table-Name
 */

export interface UrlParams {
  connection?: string;
  table?: string;
}

/**
 * Liest Query-Parameter aus der URL
 */
export function getUrlParams(): UrlParams {
  const params = new URLSearchParams(window.location.search);
  return {
    connection: params.get("connection") || undefined,
    table: params.get("table") || undefined,
  };
}

/**
 * Setzt Query-Parameter in der URL
 * Nutzt replaceState um History nicht zu füllen
 */
export function setUrlParams(params: UrlParams): void {
  const searchParams = new URLSearchParams(window.location.search);

  if (params.connection) {
    searchParams.set("connection", params.connection);
  } else {
    searchParams.delete("connection");
  }

  if (params.table) {
    searchParams.set("table", params.table);
  } else {
    searchParams.delete("table");
  }

  const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
  window.history.replaceState(null, "", newUrl);
}
