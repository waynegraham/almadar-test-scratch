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

export const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN?.trim();
export const STRAPI_CLOUDFLARE_BYPASS_SECRET =
  process.env.STRAPI_CLOUDFLARE_BYPASS_SECRET?.trim();

export const IIIF_SERVER_URL = normalizeBaseUrl(
  process.env.IIIF_SERVER ?? "https://iiif-staging-almadar.biennale.org.sa/",
);

export const IIIF_IMAGE_BASE_URL = IIIF_SERVER_URL.endsWith("/iiif/3")
  ? IIIF_SERVER_URL
  : `${IIIF_SERVER_URL}/iiif/3`;

export type EnvironmentConfig = {
  strapiBaseUrl: string;
  iiifImageBaseUrl: string;
};

export type Environment = "configured" | "staging" | "production";

export function resolveEnvironment(value?: string): Environment {
  return value === "production" || value === "configured" ? value : "staging";
}

export function getEnvironmentConfig(environment?: string): EnvironmentConfig {
  if (environment === "staging" || environment === "production") {
    const suffix = environment === "staging" ? "-staging" : "";
    return {
      strapiBaseUrl: `https://cms${suffix}-almadar.biennale.org.sa`,
      iiifImageBaseUrl: `https://iiif${suffix}-almadar.biennale.org.sa/iiif/3`,
    };
  }

  return {
    strapiBaseUrl: STRAPI_BASE_URL,
    iiifImageBaseUrl: IIIF_IMAGE_BASE_URL,
  };
}
