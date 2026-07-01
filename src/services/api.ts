export async function api(endpoint: string, options?: RequestInit) {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "";
  
  // Ensure we don't duplicate slashes if base url has trailing slash and endpoint has leading slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const cleanBaseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

  return fetch(`${cleanBaseUrl}${cleanEndpoint}`, options);
}
