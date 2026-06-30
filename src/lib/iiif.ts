export const IIIF_IMAGE_BASE_URL =
  "https://iiif-almadar-test.foxfirelab.com/iiif/3";

export const IIIF_THUMBNAIL_WIDTHS = [256, 384, 512, 768] as const;

export function encodeIiifIdentifier(identifier: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(identifier));
  } catch {
    return encodeURIComponent(identifier);
  }
}

type IiifImageUrlOptions = {
  width: number;
  baseUrl?: string;
  format?: "jpg" | "png";
};

export function iiifImageUrlForIdentifier(
  identifier: string,
  {
    width,
    baseUrl = IIIF_IMAGE_BASE_URL,
    format = "png",
  }: IiifImageUrlOptions,
) {
  return `${baseUrl}/${encodeIiifIdentifier(
    identifier,
  )}/full/${width},/0/default.${format}`;
}

type IiifSrcSetOptions = {
  widths?: readonly number[];
  baseUrl?: string;
  format?: "jpg" | "png";
};

export function iiifThumbnailSrcSetForIdentifier(
  identifier: string,
  {
    widths = IIIF_THUMBNAIL_WIDTHS,
    baseUrl = IIIF_IMAGE_BASE_URL,
    format = "png",
  }: IiifSrcSetOptions = {},
) {
  return widths
    .map(
      (width) =>
        `${iiifImageUrlForIdentifier(identifier, {
          width,
          baseUrl,
          format,
        })} ${width}w`,
    )
    .join(", ");
}
