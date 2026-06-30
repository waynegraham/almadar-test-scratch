import type { ImgHTMLAttributes } from "react";
import {
  IIIF_THUMBNAIL_WIDTHS,
  iiifImageUrlForIdentifier,
  iiifThumbnailSrcSetForIdentifier,
} from "@/lib/iiif";

type IiifThumbnailProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "srcSet"
> & {
  identifier: string;
  widths?: readonly number[];
  format?: "jpg" | "png" | "webp";
};

export function IiifThumbnail({
  identifier,
  widths = IIIF_THUMBNAIL_WIDTHS,
  format = "png",
  sizes = "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  loading = "lazy",
  decoding = "async",
  ...props
}: IiifThumbnailProps) {
  const fallbackWidth = widths[0] ?? IIIF_THUMBNAIL_WIDTHS[0];

  return (
    <img
      {...props}
      src={iiifImageUrlForIdentifier(identifier, {
        width: fallbackWidth,
        format,
      })}
      srcSet={iiifThumbnailSrcSetForIdentifier(identifier, { widths, format })}
      sizes={sizes}
      loading={loading}
      decoding={decoding}
    />
  );
}
