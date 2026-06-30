"use client";

import type OpenSeadragonType from "openseadragon";
import { useEffect, useId, useMemo, useRef, useState } from "react";

type IiifImage = {
  sequence?: number;
  label?: string | null;
  folioLabel?: string | null;
  infoJsonUrl?: string | null;
  cantaloupeIdentifier?: string | null;
};

type IiifViewerProps = {
  images: IiifImage[];
};

function imageLabel(image: IiifImage, index: number) {
  return (
    image.label?.trim() ||
    image.folioLabel?.trim() ||
    image.cantaloupeIdentifier?.trim() ||
    `Image ${index + 1}`
  );
}

export function IiifViewer({ images }: IiifViewerProps) {
  const reactId = useId();
  const elementId = `iiif-viewer-${reactId.replace(/:/g, "")}`;
  const viewerRef = useRef<OpenSeadragonType.Viewer | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const viewableImages = useMemo(
    () => images.filter((image) => Boolean(image.infoJsonUrl)),
    [images],
  );
  const activeTileSource =
    viewableImages[activeIndex]?.infoJsonUrl ?? viewableImages[0]?.infoJsonUrl;

  useEffect(() => {
    if (!activeTileSource) {
      return;
    }

    let cancelled = false;
    const initTimer = window.setTimeout(async () => {
      const { default: OpenSeadragon } = await import("openseadragon");

      if (cancelled) {
        return;
      }

      viewerRef.current = OpenSeadragon({
        id: elementId,
        prefixUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/6.0.2/images/",
        tileSources: activeTileSource,
        drawer: "canvas",
        showNavigator: true,
        preserveViewport: false,
        visibilityRatio: 1,
        crossOriginPolicy: "Anonymous",
      });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(initTimer);
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [activeTileSource, elementId]);

  if (viewableImages.length === 0) {
    return (
      <div className="flex min-h-[420px] items-center justify-center border border-stone-300 bg-stone-100 px-6 text-center text-sm text-stone-600">
        No IIIF image sources are available for this work.
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div
        id={elementId}
        className="h-[70vh] min-h-[420px] w-full border border-stone-300 bg-black"
      />
      <div className="flex flex-wrap gap-2" aria-label="IIIF image list">
        {viewableImages.map((image, index) => (
          <button
            key={`${image.infoJsonUrl ?? image.cantaloupeIdentifier ?? index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={
              index === activeIndex
                ? "border border-stone-900 bg-stone-900 px-2 py-1 text-left text-xs text-white"
                : "border border-stone-300 bg-white px-2 py-1 text-left text-xs text-stone-600 hover:border-stone-900"
            }
          >
            {image.sequence ? `${image.sequence}. ` : ""}
            {imageLabel(image, index)}
          </button>
        ))}
      </div>
    </section>
  );
}
