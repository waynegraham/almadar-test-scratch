function withoutTrailingSlash(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export const STRAPI_BASE_URL = withoutTrailingSlash(
  process.env.STRAPI_HOST ?? "http://localhost:1337",
);

export const IIIF_SERVER_URL = withoutTrailingSlash(
  process.env.IIIF_SERVER ?? "https://iiif-almadar-test.foxfirelab.com",
);

export const IIIF_IMAGE_BASE_URL = IIIF_SERVER_URL.endsWith("/iiif/3")
  ? IIIF_SERVER_URL
  : `${IIIF_SERVER_URL}/iiif/3`;
