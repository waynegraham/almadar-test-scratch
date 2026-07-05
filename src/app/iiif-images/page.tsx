import Link from "next/link";
import { IiifThumbnail } from "@/components/iiif-thumbnail";
import {
  getIiifImages,
  IIIF_IMAGES_ENDPOINT,
  IIIF_IMAGES_PAGE_SIZE,
} from "@/lib/iiif-images";

type PageSearchParams = Promise<{
  page?: string | string[];
}>;

function currentPageFrom(searchParams: Awaited<PageSearchParams>) {
  const rawPage = Array.isArray(searchParams.page)
    ? searchParams.page[0]
    : searchParams.page;
  const page = Number(rawPage);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function pageHref(page: number) {
  return page === 1 ? "/iiif-images" : `/iiif-images?page=${page}`;
}

function Pagination({
  page,
  pageCount,
  total,
}: {
  page: number;
  pageCount: number;
  total?: number;
}) {
  if (pageCount <= 1) {
    return null;
  }

  const currentPage = Math.min(page, pageCount);
  const previousPage = currentPage - 1;
  const nextPage = currentPage + 1;
  const controlClass =
    "flex h-10 items-center justify-center border border-stone-300 bg-white px-4 text-sm font-medium text-stone-800 transition-colors hover:border-stone-900 hover:bg-stone-900 hover:text-white";
  const disabledClass =
    "flex h-10 items-center justify-center border border-stone-200 bg-stone-100 px-4 text-sm font-medium text-stone-400";

  return (
    <nav
      aria-label="IIIF image pagination"
      className="flex flex-col gap-3 border-y border-stone-300 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-stone-600">
        Page {currentPage} of {pageCount}
        {typeof total === "number" ? ` · ${total} images` : ""}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {previousPage >= 1 ? (
          <Link className={controlClass} href={pageHref(previousPage)}>
            Previous
          </Link>
        ) : (
          <span className={disabledClass}>Previous</span>
        )}
        <span className="flex h-10 items-center border border-stone-300 bg-white px-4 text-sm text-stone-600">
          {IIIF_IMAGES_PAGE_SIZE} per page
        </span>
        {nextPage <= pageCount ? (
          <Link className={controlClass} href={pageHref(nextPage)}>
            Next
          </Link>
        ) : (
          <span className={disabledClass}>Next</span>
        )}
      </div>
    </nav>
  );
}

function imageLabel({
  label,
  folioLabel,
  cantaloupeIdentifier,
  sequence,
}: {
  label?: string;
  folioLabel?: string;
  cantaloupeIdentifier?: string;
  sequence?: number;
}) {
  return (
    label?.trim() ||
    folioLabel?.trim() ||
    cantaloupeIdentifier?.trim() ||
    `IIIF image${sequence ? ` ${sequence}` : ""}`
  );
}

export default async function IiifImagesPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  let data: Awaited<ReturnType<typeof getIiifImages>> | undefined;
  let error: string | undefined;
  const requestedPage = currentPageFrom(await searchParams);

  try {
    data = await getIiifImages(requestedPage);
  } catch (caught) {
    error =
      caught instanceof Error ? caught.message : "Unable to load IIIF images.";
  }

  const pagination = data?.pagination;

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-stone-950">
      <section className="mx-auto flex w-full max-w-[1800px] flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 border-b border-stone-300 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-stone-600 underline-offset-4 hover:text-stone-950 hover:underline"
            >
              Back to collection
            </Link>
            <p className="mt-5 text-sm font-medium uppercase tracking-[0.12em] text-stone-600">
              Thumbnail review
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-stone-950 sm:text-4xl">
              IIIF image thumbnails
            </h1>
          </div>
          {pagination ? (
            <p className="text-sm text-stone-600">
              Showing {data?.images.length ?? 0} of {pagination.total ?? 0} images
            </p>
          ) : null}
        </header>

        {error ? (
          <section className="border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
            <h2 className="font-semibold">Could not load IIIF images</h2>
            <p className="mt-2">{error}</p>
            <p className="mt-3 break-all text-amber-900">
              Expected endpoint: {IIIF_IMAGES_ENDPOINT}
            </p>
          </section>
        ) : null}

        {pagination ? (
          <Pagination
            page={pagination.page ?? requestedPage}
            pageCount={pagination.pageCount ?? 1}
            total={pagination.total}
          />
        ) : null}

        {data && data.images.length === 0 ? (
          <section className="border border-stone-300 bg-white p-8 text-center text-stone-600">
            No IIIF images were returned.
          </section>
        ) : null}

        {data && data.images.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
            {data.images.map((image) => {
              const label = imageLabel(image);
              const dimensions =
                image.width && image.height ? `${image.width} x ${image.height}` : "";
              const card = (
                <>
                  <div className="aspect-square bg-stone-200">
                    {image.cantaloupeIdentifier ? (
                      <IiifThumbnail
                        identifier={image.cantaloupeIdentifier}
                        widths={[160, 320]}
                        format="jpg"
                        sizes="160px"
                        alt={label}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-3 text-center text-xs text-stone-500">
                        No thumbnail
                      </div>
                    )}
                  </div>
                  <div className="flex min-h-36 flex-col gap-2 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {image.iabCode ? (
                        <span className="bg-stone-900 px-2 py-1 font-mono text-[11px] text-white">
                          {image.iabCode}
                        </span>
                      ) : (
                        <span className="bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-950">
                          No work link
                        </span>
                      )}
                      {typeof image.sequence === "number" ? (
                        <span className="text-xs text-stone-500">
                          Seq {image.sequence}
                        </span>
                      ) : null}
                    </div>
                    <p className="line-clamp-3 text-xs leading-5 text-stone-700">
                      {label}
                    </p>
                    {dimensions ? (
                      <p className="mt-auto font-mono text-[11px] text-stone-500">
                        {dimensions}
                      </p>
                    ) : null}
                  </div>
                </>
              );

              return image.iabCode ? (
                <Link
                  key={image.id}
                  href={`/works/${encodeURIComponent(image.iabCode)}`}
                  title={image.sourcePath ?? label}
                  className="group overflow-hidden border border-stone-300 bg-white shadow-sm transition-colors hover:border-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
                >
                  {card}
                </Link>
              ) : (
                <article
                  key={image.id}
                  title={image.sourcePath ?? label}
                  className="overflow-hidden border border-amber-300 bg-white shadow-sm"
                >
                  {card}
                </article>
              );
            })}
          </div>
        ) : null}

        {pagination ? (
          <Pagination
            page={pagination.page ?? requestedPage}
            pageCount={pagination.pageCount ?? 1}
            total={pagination.total}
          />
        ) : null}

        {data ? (
          <details className="border border-stone-300 bg-white p-4 text-sm">
            <summary className="cursor-pointer font-medium">Generated API URL</summary>
            <p className="mt-3 break-all font-mono text-xs text-stone-600">
              {data.url}
            </p>
          </details>
        ) : null}
      </section>
    </main>
  );
}
