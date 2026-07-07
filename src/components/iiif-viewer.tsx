"use client";

import { IiifThumbnail } from "@/components/iiif-thumbnail";
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

type IiifTileSource = OpenSeadragonType.TileSourceOptions & {
  tileFormat: "png";
  preferredFormats?: string[];
  [key: string]: unknown;
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

    const abortController = new AbortController();
    let cancelled = false;
    const initTimer = window.setTimeout(async () => {
      try {
        const [{ default: OpenSeadragon }, infoJson] = await Promise.all([
          import("openseadragon"),
          fetch(activeTileSource, { signal: abortController.signal }).then(
            (response) => {
              if (!response.ok) {
                throw new Error(
                  `Failed to load IIIF info.json: ${response.status}`,
                );
              }

              return response.json() as Promise<Record<string, unknown>>;
            },
          ),
        ]);

        if (cancelled) {
          return;
        }

        const preferredFormats = Array.isArray(infoJson.preferredFormats)
          ? [
              "png",
              ...infoJson.preferredFormats.filter(
                (format): format is string =>
                  typeof format === "string" && format !== "png",
              ),
            ]
          : undefined;
        const tileSource: IiifTileSource = {
          ...infoJson,
          ...(preferredFormats ? { preferredFormats } : {}),
          tileFormat: "png",
        };

        viewerRef.current = OpenSeadragon({
          id: elementId,
          prefixUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/6.0.2/images/",
          tileSources: tileSource,
          drawer: "canvas",
          showNavigationControl: false,
          showNavigator: true,
          preserveViewport: false,
          visibilityRatio: 1,
          crossOriginPolicy: "Anonymous",
        });
      } catch (error) {
        if (!cancelled && !abortController.signal.aborted) {
          console.error(error);
        }
      }
    }, 0);

    return () => {
      cancelled = true;
      abortController.abort();
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
      <div className="flex flex-wrap gap-3" aria-label="IIIF image list">
        {viewableImages.map((image, index) => {
          const label = imageLabel(image, index);

          return (
            <button
              key={`${image.infoJsonUrl ?? image.cantaloupeIdentifier ?? index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={label}
              aria-current={index === activeIndex ? "true" : undefined}
              title={label}
              className={
                index === activeIndex
                  ? "w-[160px] border border-stone-900 bg-stone-900 p-1 shadow-sm"
                  : "w-[160px] border border-stone-300 bg-white p-1 shadow-sm transition-colors hover:border-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
              }
            >
              {image.cantaloupeIdentifier ? (
                <IiifThumbnail
                  identifier={image.cantaloupeIdentifier}
                  widths={[160]}
                  format="png"
                  alt={label}
                  className="aspect-[4/3] w-full bg-stone-100 object-contain"
                />
              ) : (
                <span className="flex aspect-[4/3] w-full items-center justify-center bg-stone-100 px-2 text-center text-xs text-stone-500">
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
