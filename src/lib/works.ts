import { createHash } from "node:crypto";
import qs from "qs";
import {
  STRAPI_API_TOKEN,
  STRAPI_BASE_URL,
  STRAPI_CLOUDFLARE_BYPASS_SECRET,
} from "./config";
import {
  encodeIiifIdentifier,
  IIIF_IMAGE_BASE_URL,
  iiifInfoJsonUrlForIdentifier,
  iiifImageUrlForIdentifier,
  iiifThumbnailSrcSetForIdentifier,
} from "./iiif";

export const PAGE_SIZE = 24;
export {
  encodeIiifIdentifier,
  IIIF_IMAGE_BASE_URL,
  STRAPI_BASE_URL,
  iiifInfoJsonUrlForIdentifier,
  iiifImageUrlForIdentifier,
  iiifThumbnailSrcSetForIdentifier,
};

function strapiFetch(url: string) {
  return fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "almadar-test-scratch/1.0",
      ...(STRAPI_API_TOKEN
        ? {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          }
        : {}),
      ...(STRAPI_CLOUDFLARE_BYPASS_SECRET
        ? {
            "X-Almadar-App-Secret": STRAPI_CLOUDFLARE_BYPASS_SECRET,
          }
        : {}),
    },
  });
}

async function strapiErrorMessage(response: Response) {
  const tokenDiagnostics = STRAPI_API_TOKEN
    ? [
        "yes",
        `length: ${STRAPI_API_TOKEN.length}`,
        `fingerprint: ${createHash("sha256")
          .update(STRAPI_API_TOKEN)
          .digest("hex")
          .slice(0, 12)}`,
        `starts with Bearer: ${/^bearer\s+/i.test(STRAPI_API_TOKEN) ? "yes" : "no"}`,
        `quoted: ${/^["']|["']$/.test(STRAPI_API_TOKEN) ? "yes" : "no"}`,
      ].join(", ")
    : "no";
  const responseText = await response.text().catch(() => "");
  const bodySnippet = responseText
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
  const server = response.headers.get("server");
  const poweredBy = response.headers.get("x-powered-by");
  const responseDiagnostics = [
    server ? `server: ${server}` : undefined,
    poweredBy ? `x-powered-by: ${poweredBy}` : undefined,
    bodySnippet ? `body: ${bodySnippet}` : undefined,
  ]
    .filter(Boolean)
    .join("; ");

  return `Strapi returned ${response.status} ${
    response.statusText
  } (STRAPI_API_TOKEN configured: ${tokenDiagnostics}${
    responseDiagnostics ? `; ${responseDiagnostics}` : ""
  })`;
}

export type StrapiRelation<T> =
  | T[]
  | {
      data?: T[];
    };

export type LocalizedValue = {
  en?: string | null;
  ar?: string | null;
};

export type StrapiImage = {
  id?: number | string;
  documentId?: string;
  sequence?: number;
  label?: string | null;
  folioLabel?: string | null;
  cantaloupeIdentifier?: string | null;
  infoJsonUrl?: string | null;
  thumbnailUrl?: string | null;
  captionEn?: string | null;
  captionAr?: string | null;
  attributes?: Omit<StrapiImage, "attributes">;
};

export type StrapiAsset = {
  id?: number | string;
  title?: string | null;
  iiifBaseUrl?: string | null;
  images?: StrapiRelation<StrapiImage>;
  attributes?: Omit<StrapiAsset, "attributes">;
};

export type StrapiNamedEntity = {
  id?: number | string;
  documentId?: string;
  displayTitle?: string | null;
  nameEn?: string | null;
  nameAr?: string | null;
  titleEn?: string | null;
  titleAr?: string | null;
  labelEn?: string | null;
  labelAr?: string | null;
  biographyEn?: string | null;
  biographyAr?: string | null;
  url?: string | null;
  slug?: string | null;
  attributes?: Omit<StrapiNamedEntity, "attributes">;
};

export type StrapiAgentCredit = {
  id?: number | string;
  sortOrder?: number | null;
  agent?: StrapiNamedEntity;
  agent_role?: StrapiNamedEntity;
  attributes?: Omit<StrapiAgentCredit, "attributes">;
};

export type StrapiTextBlock = {
  id?: number | string;
  sortOrder?: number | null;
  type?: string | null;
  labelEn?: string | null;
  labelAr?: string | null;
  titleEn?: string | null;
  titleAr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  textEn?: string | null;
  textAr?: string | null;
  essayEn?: string | null;
  essayAr?: string | null;
  footnotesEn?: string | null;
  footnotesAr?: string | null;
  attributes?: Omit<StrapiTextBlock, "attributes">;
};

export type StrapiWork = {
  id?: number | string;
  documentId?: string;
  iabCode?: string | null;
  displayTitle?: string | null;
  titleEn?: string | null;
  titleAr?: string | null;
  originEn?: string | null;
  originAr?: string | null;
  dimensionEn?: string | null;
  dimensionAr?: string | null;
  materialDisplayEn?: string | null;
  materialDisplayAr?: string | null;
  dateDisplayGregorianEn?: string | null;
  dateDisplayGregorianAr?: string | null;
  dateDisplayHijriEn?: string | null;
  dateDisplayHijriAr?: string | null;
  earliestDate?: number | string | null;
  latestDate?: number | string | null;
  creditLineEn?: string | null;
  creditLineAr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  footnoteEn?: string | null;
  footnoteAr?: string | null;
  gallery?: StrapiNamedEntity | null;
  institution?: StrapiNamedEntity | null;
  agentCredits?: StrapiRelation<StrapiAgentCredit>;
  additionalDescriptions?: StrapiRelation<StrapiTextBlock>;
  inscriptions?: StrapiRelation<StrapiTextBlock>;
  curatedStories?: StrapiRelation<StrapiTextBlock>;
  iiif_assets?: StrapiRelation<StrapiAsset>;
  attributes?: Omit<StrapiWork, "attributes">;
};

export type StrapiWorksResponse = {
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

export type WorkCard = {
  id: string;
  iabCode: string;
  title: string;
  subtitle?: string;
  imageLabel?: string;
  thumbnailIdentifier?: string;
  thumbnailUrl?: string;
};

export type WorkDetail = Omit<StrapiWork, "attributes"> & {
  images: Array<Omit<StrapiImage, "attributes">>;
};

export function unwrapAttributes<T extends { attributes?: Omit<T, "attributes"> }>(
  item: T,
): Omit<T, "attributes"> {
  return (item.attributes ?? item) as Omit<T, "attributes">;
}

export function relationItems<T>(relation?: StrapiRelation<T>): T[] {
  if (!relation) {
    return [];
  }

  if (Array.isArray(relation)) {
    return relation;
  }

  return relation.data ?? [];
}

export function thumbnailUrlFor(image?: Omit<StrapiImage, "attributes">) {
  if (!image?.cantaloupeIdentifier) {
    return undefined;
  }

  return iiifImageUrlForIdentifier(image.cantaloupeIdentifier, { width: 256 });
}

export function infoJsonUrlFor(image: Omit<StrapiImage, "attributes">) {
  if (!image.cantaloupeIdentifier) {
    return image.infoJsonUrl ?? undefined;
  }

  return iiifInfoJsonUrlForIdentifier(image.cantaloupeIdentifier);
}

export function workTitle(work: Omit<StrapiWork, "attributes">) {
  return (
    work.displayTitle?.trim() ||
    work.titleEn?.trim() ||
    work.titleAr?.trim() ||
    "Untitled work"
  );
}

export function worksQuery(page: number) {
  return qs.stringify(
    {
      status: "published",
      pagination: {
        page,
        pageSize: PAGE_SIZE,
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
}

export function workDetailQuery(iabCode: string) {
  return qs.stringify(
    {
      status: "published",
      pagination: {
        page: 1,
        pageSize: 1,
      },
      filters: {
        iabCode: {
          $eq: iabCode,
        },
      },
      populate: {
        gallery: true,
        institution: true,
        additionalDescriptions: {
          populate: "*",
        },
        inscriptions: {
          populate: "*",
        },
        curatedStories: true,
        agentCredits: {
          populate: "*",
        },
        iiif_assets: {
          populate: {
            images: {
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
}

export function normalizeWork(work: StrapiWork): WorkCard {
  const item = unwrapAttributes(work);
  const asset = relationItems(item.iiif_assets).map(unwrapAttributes).at(0);
  const image = relationItems(asset?.images).map(unwrapAttributes).at(0);
  const stableId = item.iabCode ?? item.documentId ?? work.id;

  return {
    id: String(stableId ?? "unknown-work"),
    iabCode: item.iabCode ?? "No IAB code",
    title: workTitle(item),
    subtitle: asset?.title ?? undefined,
    imageLabel: image?.label ?? undefined,
    thumbnailIdentifier: image?.cantaloupeIdentifier ?? undefined,
    thumbnailUrl: thumbnailUrlFor(image),
  };
}

export function normalizeWorkDetail(work: StrapiWork): WorkDetail {
  const item = unwrapAttributes(work);
  const images = relationItems(item.iiif_assets)
    .map(unwrapAttributes)
    .flatMap((asset) => relationItems(asset.images).map(unwrapAttributes))
    .map((image) => ({
      ...image,
      infoJsonUrl: infoJsonUrlFor(image),
    }))
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

  return {
    ...item,
    images,
  };
}

export async function getWorks(page: number) {
  const query = worksQuery(page);
  const url = `${STRAPI_BASE_URL}/api/works?${query}`;
  const response = await strapiFetch(url);

  if (!response.ok) {
    throw new Error(await strapiErrorMessage(response));
  }

  const payload = (await response.json()) as StrapiWorksResponse;

  return {
    url,
    works: (payload.data ?? []).map(normalizeWork),
    pagination: payload.meta?.pagination,
  };
}

export async function getWorkByIabCode(iabCode: string) {
  const query = workDetailQuery(iabCode);
  const url = `${STRAPI_BASE_URL}/api/works?${query}`;
  const response = await strapiFetch(url);

  if (!response.ok) {
    throw new Error(await strapiErrorMessage(response));
  }

  const payload = (await response.json()) as StrapiWorksResponse;
  const work = payload.data?.at(0);

  return {
    url,
    work: work ? normalizeWorkDetail(work) : undefined,
  };
}
