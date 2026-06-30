"use client";

import type OpenSeadragonType from "openseadragon";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

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
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullPage, setIsFullPage] = useState(false);
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
        showNavigationControl: false,
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

  useEffect(() => {
    const updateFullPageState = () => {
      setIsFullPage(document.fullscreenElement === wrapperRef.current);
    };

    document.addEventListener("fullscreenchange", updateFullPageState);

    return () => {
      document.removeEventListener("fullscreenchange", updateFullPageState);
    };
  }, []);

  const zoomBy = useCallback((factor: number) => {
    const viewer = viewerRef.current;

    if (!viewer) {
      return;
    }

    viewer.viewport.zoomBy(factor);
    viewer.viewport.applyConstraints();
  }, []);

  const goHome = useCallback(() => {
    viewerRef.current?.viewport.goHome();
  }, []);

  const toggleFullPage = useCallback(() => {
    const wrapper = wrapperRef.current;

    if (!wrapper) {
      return;
    }

    if (document.fullscreenElement === wrapper) {
      void document.exitFullscreen();
      return;
    }

    void wrapper.requestFullscreen();
  }, []);

  const goToImage = useCallback(
    (nextIndex: number) => {
      setActiveIndex(Math.max(0, Math.min(nextIndex, viewableImages.length - 1)));
    },
    [viewableImages.length],
  );

  if (viewableImages.length === 0) {
    return (
      <div className="flex min-h-[420px] items-center justify-center border border-stone-300 bg-stone-100 px-6 text-center text-sm text-stone-600">
        No IIIF image sources are available for this work.
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div ref={wrapperRef} className="relative border border-stone-300 bg-black">
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => zoomBy(1.25)}
            aria-label="Zoom in"
            className="flex h-9 w-9 items-center justify-center border border-white/30 bg-black/75 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-white hover:text-stone-950 focus:outline-none focus:ring-2 focus:ring-white"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => zoomBy(0.8)}
            aria-label="Zoom out"
            className="flex h-9 w-9 items-center justify-center border border-white/30 bg-black/75 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-white hover:text-stone-950 focus:outline-none focus:ring-2 focus:ring-white"
          >
            -
          </button>
          <button
            type="button"
            onClick={goHome}
            className="flex h-9 items-center justify-center border border-white/30 bg-black/75 px-3 text-xs font-semibold uppercase tracking-[0.08em] text-white shadow-sm transition-colors hover:bg-white hover:text-stone-950 focus:outline-none focus:ring-2 focus:ring-white"
          >
            Fit
          </button>
          <button
            type="button"
            onClick={toggleFullPage}
            className="flex h-9 items-center justify-center border border-white/30 bg-black/75 px-3 text-xs font-semibold uppercase tracking-[0.08em] text-white shadow-sm transition-colors hover:bg-white hover:text-stone-950 focus:outline-none focus:ring-2 focus:ring-white"
          >
            {isFullPage ? "Exit" : "Full"}
          </button>
          {viewableImages.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => goToImage(activeIndex - 1)}
                disabled={activeIndex === 0}
                className="flex h-9 items-center justify-center border border-white/30 bg-black/75 px-3 text-xs font-semibold uppercase tracking-[0.08em] text-white shadow-sm transition-colors hover:bg-white hover:text-stone-950 focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-black/40 disabled:text-white/35"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => goToImage(activeIndex + 1)}
                disabled={activeIndex === viewableImages.length - 1}
                className="flex h-9 items-center justify-center border border-white/30 bg-black/75 px-3 text-xs font-semibold uppercase tracking-[0.08em] text-white shadow-sm transition-colors hover:bg-white hover:text-stone-950 focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-black/40 disabled:text-white/35"
              >
                Next
              </button>
            </>
          ) : null}
        </div>
        <div id={elementId} className="h-[70vh] min-h-[420px] w-full" />
      </div>
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
