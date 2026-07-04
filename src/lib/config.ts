function withoutTrailingSlash(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function normalizeBaseUrl(value: string) {
  const normalized = withoutTrailingSlash(value);

  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(normalized)) {
    return normalized;
  }

  return `http://${normalized}`;
}

export function normalizeStrapiBaseUrl(value: string, port?: string) {
  const url = new URL(normalizeBaseUrl(value));

  if (url.hostname === "0.0.0.0") {
    url.hostname = "localhost";
  }

  if (!url.port && port) {
    url.port = port;
  }

  return withoutTrailingSlash(url.toString());
}

export const STRAPI_BASE_URL = normalizeStrapiBaseUrl(
  process.env.NEXT_PUBLIC_STRAPI_URL ??
    process.env.STRAPI_URL ??
    process.env.STRAPI_HOST ??
    "http://localhost:1337",
  process.env.STRAPI_PORT,
);

export const IIIF_SERVER_URL = normalizeBaseUrl(
  process.env.IIIF_SERVER ?? "https://iiif-almadar-test.foxfirelab.com",
);

export const IIIF_IMAGE_BASE_URL = IIIF_SERVER_URL.endsWith("/iiif/3")
  ? IIIF_SERVER_URL
  : `${IIIF_SERVER_URL}/iiif/3`;
