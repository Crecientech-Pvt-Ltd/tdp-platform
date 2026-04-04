export const DATA_COMMONS_PATH_QUERY_KEY = 'dataCommonsPath';

export function appendDataCommonsPath(params: URLSearchParams, dataCommonsPath?: string) {
  const normalizedPath = dataCommonsPath?.trim();

  if (normalizedPath) {
    params.set(DATA_COMMONS_PATH_QUERY_KEY, normalizedPath);
  }
}

export function buildDataCommonsApiUrl(apiBase: string | undefined, endpoint: string, dataCommonsPath?: string) {
  const normalizedBase = (apiBase ?? '').replace(/\/$/, '');
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = normalizedBase
    ? new URL(`${normalizedBase}${normalizedEndpoint}`)
    : new URL(normalizedEndpoint, window.location.origin);

  appendDataCommonsPath(url.searchParams, dataCommonsPath);

  return url.toString();
}
