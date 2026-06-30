import qs from "qs";

const STRAPI_BASE_URL = "http://localhost:1337";
const IIIF_IMAGE_BASE_URL = "https://iiif-almadar-test.foxfirelab.com/iiif/3";

type StrapiRelation<T> =
  | T[]
  | {
      data?: T[];
    };

type StrapiImage = {
  id?: number | string;
  sequence?: number;
  label?: string | null;
  cantaloupeIdentifier?: string | null;
  infoJsonUrl?: string | null;
  attributes?: Omit<StrapiImage, "attributes">;
};

type StrapiAsset = {
  id?: number | string;
  title?: string | null;
  iiifBaseUrl?: string | null;
  images?: StrapiRelation<StrapiImage>;
  attributes?: Omit<StrapiAsset, "attributes">;
};

type StrapiWork = {
  id?: number | string;
  documentId?: string;
  iabCode?: string | null;
  displayTitle?: string | null;
  titleEn?: string | null;
  titleAr?: string | null;
  iiif_assets?: StrapiRelation<StrapiAsset>;
  attributes?: Omit<StrapiWork, "attributes">;
};

type StrapiWorksResponse = {
  data?: StrapiWork[];
  meta?: {
    pagination?: {
      page?: number;
      pageSize?: number;
      pageCount?: number;
      total?: number;
    };
  };
};

type WorkCard = {
  id: string;
  iabCode: string;
  title: string;
  subtitle?: string;
  imageLabel?: string;
  thumbnailUrl?: string;
};

const query = qs.stringify(
  {
    status: "published",
    pagination: {
      page: 1,
      pageSize: 25,
    },
    sort: ["iabCode:asc"],
    filters: {
      iabCode: {
        $startsWith: "25-",
      },
    },
    fields: ["iabCode", "displayTitle", "titleEn", "titleAr"],
    populate: {
      iiif_assets: {
        fields: ["title", "iiifBaseUrl"],
        populate: {
          images: {
            filters: {
              sequence: {
                $eq: 1,
              },
            },
            fields: ["sequence", "label", "cantaloupeIdentifier", "infoJsonUrl"],
            sort: ["sequence:asc"],
          },
        },
      },
    },
  },
  {
    encodeValuesOnly: true,
  },
);

function unwrapAttributes<T extends { attributes?: Omit<T, "attributes"> }>(
  item: T,
): Omit<T, "attributes"> {
  return (item.attributes ?? item) as Omit<T, "attributes">;
}

function relationItems<T>(relation?: StrapiRelation<T>): T[] {
  if (!relation) {
    return [];
  }

  if (Array.isArray(relation)) {
    return relation;
  }

  return relation.data ?? [];
}

function encodeIiifIdentifier(identifier: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(identifier));
  } catch {
    return encodeURIComponent(identifier);
  }
}

function thumbnailUrlFor(image?: Omit<StrapiImage, "attributes">) {
  if (!image?.cantaloupeIdentifier) {
    return undefined;
  }

  return `${IIIF_IMAGE_BASE_URL}/${encodeIiifIdentifier(
    image.cantaloupeIdentifier,
  )}/full/256,/0/default.png`;
}

function workTitle(work: Omit<StrapiWork, "attributes">) {
  return (
    work.displayTitle?.trim() ||
    work.titleEn?.trim() ||
    work.titleAr?.trim() ||
    "Untitled work"
  );
}

function normalizeWork(work: StrapiWork): WorkCard {
  const item = unwrapAttributes(work);
  const asset = relationItems(item.iiif_assets).map(unwrapAttributes).at(0);
  const image = relationItems(asset?.images).map(unwrapAttributes).at(0);

  return {
    id: String(work.id ?? item.documentId ?? item.iabCode ?? crypto.randomUUID()),
    iabCode: item.iabCode ?? "No IAB code",
    title: workTitle(item),
    subtitle: asset?.title ?? undefined,
    imageLabel: image?.label ?? undefined,
    thumbnailUrl: thumbnailUrlFor(image),
  };
}

async function getWorks() {
  const url = `${STRAPI_BASE_URL}/api/works?${query}`;
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Strapi returned ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as StrapiWorksResponse;

  return {
    url,
    works: (payload.data ?? []).map(normalizeWork),
    pagination: payload.meta?.pagination,
  };
}

export default async function Home() {
  let data: Awaited<ReturnType<typeof getWorks>> | undefined;
  let error: string | undefined;

  try {
    data = await getWorks();
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
              Expected endpoint: {STRAPI_BASE_URL}/api/works?{query}
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
              <article
                key={work.id}
                className="overflow-hidden border border-stone-300 bg-white shadow-sm"
              >
                <div className="aspect-[4/3] bg-stone-200">
                  {work.thumbnailUrl ? (
                    <img
                      src={work.thumbnailUrl}
                      alt={work.imageLabel || work.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
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
                    <h2 className="line-clamp-3 text-lg font-semibold leading-6">
                      {work.title}
                    </h2>
                    {work.subtitle ? (
                      <p className="mt-2 line-clamp-2 text-sm text-stone-600">
                        {work.subtitle}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
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
