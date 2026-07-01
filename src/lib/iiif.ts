import { IIIF_IMAGE_BASE_URL } from "./config";

export { IIIF_IMAGE_BASE_URL };

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

type IiifInfoJsonUrlOptions = {
  baseUrl?: string;
};

export function iiifInfoJsonUrlForIdentifier(
  identifier: string,
  { baseUrl = IIIF_IMAGE_BASE_URL }: IiifInfoJsonUrlOptions = {},
) {
  return `${baseUrl}/${encodeIiifIdentifier(identifier)}/info.json`;
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
