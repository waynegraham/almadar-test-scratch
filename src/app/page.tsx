import Link from "next/link";
import { IiifThumbnail } from "@/components/iiif-thumbnail";
import { getWorks, STRAPI_BASE_URL, worksQuery } from "@/lib/works";

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
  return page === 1 ? "/" : `/?page=${page}`;
}

function paginationRange(currentPage: number, pageCount: number) {
  const pages = new Set([1, pageCount]);

  for (let page = currentPage - 2; page <= currentPage + 2; page += 1) {
    if (page > 1 && page < pageCount) {
      pages.add(page);
    }
  }

  const sortedPages = [...pages].sort((a, b) => a - b);

  return sortedPages.flatMap((page, index) => {
    const previousPage = sortedPages[index - 1];

    if (previousPage && page - previousPage > 1) {
      return ["ellipsis", page] as const;
    }

    return [page] as const;
  });
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
    "flex h-10 min-w-10 items-center justify-center border border-stone-300 bg-white px-3 text-sm font-medium text-stone-800 transition-colors hover:border-stone-900 hover:bg-stone-900 hover:text-white";
  const disabledClass =
    "flex h-10 min-w-10 items-center justify-center border border-stone-200 bg-stone-100 px-3 text-sm font-medium text-stone-400";

  return (
    <nav
      aria-label="Collection pagination"
      className="flex flex-col gap-3 border-t border-stone-300 pt-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-stone-600">
        Page {currentPage} of {pageCount}
        {typeof total === "number" ? ` · ${total} works` : ""}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {previousPage >= 1 ? (
          <Link className={controlClass} href={pageHref(previousPage)}>
            Previous
          </Link>
        ) : (
          <span className={disabledClass}>Previous</span>
        )}

        {paginationRange(currentPage, pageCount).map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-10 min-w-10 items-center justify-center text-sm text-stone-500"
            >
              ...
            </span>
          ) : item === currentPage ? (
            <span
              key={item}
              aria-current="page"
              className="flex h-10 min-w-10 items-center justify-center border border-stone-900 bg-stone-900 px-3 text-sm font-medium text-white"
            >
              {item}
            </span>
          ) : (
            <Link key={item} className={controlClass} href={pageHref(item)}>
              {item}
            </Link>
          ),
        )}

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

export default async function Home({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  let data: Awaited<ReturnType<typeof getWorks>> | undefined;
  let error: string | undefined;
  const requestedPage = currentPageFrom(await searchParams);
  const fallbackQuery = worksQuery(requestedPage);

  try {
    data = await getWorks(requestedPage);
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Unable to load works.";
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-stone-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-3 border-b border-stone-300 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-stone-600">
              Almadar test viewer
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-stone-950 sm:text-4xl">
              Published works beginning with 25-
            </h1>
          </div>
          {data?.pagination ? (
            <p className="text-sm text-stone-600">
              Page {data.pagination.page ?? 1} of {data.pagination.pageCount ?? 1}
              {" · "}
              {data.pagination.total ?? data.works.length} works
            </p>
          ) : null}
        </header>

        {error ? (
          <section className="border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
            <h2 className="font-semibold">Could not load Strapi data</h2>
            <p className="mt-2">{error}</p>
            <p className="mt-3 break-all text-amber-900">
              Expected endpoint: {STRAPI_BASE_URL}/api/works?{fallbackQuery}
            </p>
          </section>
        ) : null}

        {data && data.works.length === 0 ? (
          <section className="border border-stone-300 bg-white p-8 text-center text-stone-600">
            No works matched this query.
          </section>
        ) : null}

        {data && data.works.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.works.map((work) => (
              <Link
                key={work.id}
                href={`/works/${encodeURIComponent(work.iabCode)}`}
                className="group overflow-hidden border border-stone-300 bg-white shadow-sm transition-colors hover:border-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
              >
                <div className="aspect-[4/3] bg-stone-200">
                  {work.thumbnailIdentifier ? (
                    <IiifThumbnail
                      identifier={work.thumbnailIdentifier}
                      alt={work.imageLabel || work.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-sm text-stone-500">
                      No thumbnail available
                    </div>
                  )}
                </div>
                <div className="flex min-h-40 flex-col gap-3 p-4">
                  <p className="w-fit bg-stone-900 px-2 py-1 font-mono text-xs text-white">
                    {work.iabCode}
                  </p>
                  <div>
                    <h2 className="line-clamp-3 text-lg font-semibold leading-6 group-hover:underline">
                      {work.title}
                    </h2>
                    {work.subtitle ? (
                      <p className="mt-2 line-clamp-2 text-sm text-stone-600">
                        {work.subtitle}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {data?.pagination ? (
          <Pagination
            page={data.pagination.page ?? requestedPage}
            pageCount={data.pagination.pageCount ?? 1}
            total={data.pagination.total}
          />
        ) : null}

        {data ? (
          <details className="border border-stone-300 bg-white p-4 text-sm">
            <summary className="cursor-pointer font-medium">Generated Strapi URL</summary>
            <p className="mt-3 break-all font-mono text-xs text-stone-600">
              {data.url}
            </p>
          </details>
        ) : null}
      </section>
    </main>
  );
}
