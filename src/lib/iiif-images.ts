import qs from "qs";

export const IIIF_IMAGES_PAGE_SIZE = 160;
export const IIIF_IMAGES_ENDPOINT =
  "https://cms-almadar-test.foxfirelab.com/api/iiif-images";

type StrapiIiifAsset = {
  id?: number | string;
  documentId?: string;
  title?: string | null;
};

type StrapiIiifImage = {
  id?: number | string;
  documentId?: string;
  sequence?: number | null;
  label?: string | null;
  folioLabel?: string | null;
  s3key?: string | null;
  cantaloupeIdentifier?: string | null;
  width?: number | null;
  height?: number | null;
  infoJsonUrl?: string | null;
  thumbnailUrl?: string | null;
  isVisible?: boolean | null;
  sourcePath?: string | null;
  iiifAsset?: StrapiIiifAsset | null;
};

type StrapiIiifImagesResponse = {
  data?: StrapiIiifImage[];
  meta?: {
    pagination?: {
      page?: number;
      pageSize?: number;
      pageCount?: number;
      total?: number;
    };
  };
};

export type IiifImageReviewItem = {
  id: string;
  iabCode?: string;
  sequence?: number;
  label?: string;
  folioLabel?: string;
  cantaloupeIdentifier?: string;
  width?: number;
  height?: number;
  isVisible?: boolean;
  sourcePath?: string;
  assetTitle?: string;
};

function iiifImagesQuery(page: number) {
  return qs.stringify(
    {
      pagination: {
        page,
        pageSize: IIIF_IMAGES_PAGE_SIZE,
      },
      sort: ["id:asc"],
      fields: [
        "sequence",
        "label",
        "folioLabel",
        "s3key",
        "cantaloupeIdentifier",
        "width",
        "height",
        "infoJsonUrl",
        "thumbnailUrl",
        "isVisible",
        "sourcePath",
      ],
      populate: {
        iiifAsset: {
          fields: ["title"],
        },
      },
    },
    {
      encodeValuesOnly: true,
    },
  );
}

function iabCodeFromImage(image: StrapiIiifImage) {
  const assetMatch = image.iiifAsset?.title?.match(/IIIF images for\s+(.+)$/i);

  if (assetMatch?.[1]) {
    return assetMatch[1].trim();
  }

  const fileKey = image.cantaloupeIdentifier ?? image.s3key ?? "";
  const filenameMatch = fileKey.match(/\b\d{2}-[A-Z]\d-\d{2,3}-\d{4}\b/i);

  return filenameMatch?.[0];
}

function normalizeIiifImage(image: StrapiIiifImage): IiifImageReviewItem {
  return {
    id: String(image.documentId ?? image.id ?? image.cantaloupeIdentifier),
    iabCode: iabCodeFromImage(image),
    sequence: image.sequence ?? undefined,
    label: image.label ?? undefined,
    folioLabel: image.folioLabel ?? undefined,
    cantaloupeIdentifier: image.cantaloupeIdentifier ?? undefined,
    width: image.width ?? undefined,
    height: image.height ?? undefined,
    isVisible: image.isVisible ?? undefined,
    sourcePath: image.sourcePath ?? undefined,
    assetTitle: image.iiifAsset?.title ?? undefined,
  };
}

async function iiifImagesErrorMessage(response: Response) {
  const responseText = await response.text().catch(() => "");
  const bodySnippet = responseText.replace(/\s+/g, " ").trim().slice(0, 240);

  return `IIIF images endpoint returned ${response.status} ${
    response.statusText
  }${bodySnippet ? `: ${bodySnippet}` : ""}`;
}

export async function getIiifImages(page: number) {
  const query = iiifImagesQuery(page);
  const url = `${IIIF_IMAGES_ENDPOINT}?${query}`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "almadar-test-scratch/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(await iiifImagesErrorMessage(response));
  }

  const payload = (await response.json()) as StrapiIiifImagesResponse;

  return {
    url,
    images: (payload.data ?? []).map(normalizeIiifImage),
    pagination: payload.meta?.pagination,
  };
}
