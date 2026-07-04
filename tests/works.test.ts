import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  getWorkByIabCode,
  getWorks,
  IIIF_IMAGE_BASE_URL,
  iiifInfoJsonUrlForIdentifier,
  iiifThumbnailSrcSetForIdentifier,
  type StrapiWorksResponse,
} from "../src/lib/works";
import { iiifImageUrlForIdentifier } from "../src/lib/iiif";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockFetch(payload: StrapiWorksResponse) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];

  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init });

    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(payload),
    } as Response);
  }) as typeof fetch;

  return calls;
}

test("getWorks returns landing-page cards with the first IIIF image thumbnail", async () => {
  const calls = mockFetch({
    data: [
      {
        id: 10,
        iabCode: "25-001",
        titleEn: "Landing work",
        iiif_assets: {
          data: [
            {
              attributes: {
                title: "Asset title",
                images: {
                  data: [
                    {
                      attributes: {
                        sequence: 1,
                        label: "Opening page",
                        cantaloupeIdentifier:
                          "25-001/folio 1 recto.tif",
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    ],
    meta: {
      pagination: {
        page: 1,
        pageSize: 24,
        pageCount: 1,
        total: 1,
      },
    },
  });

  const result = await getWorks(1);

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.init?.cache, "no-store");
  assert.match(calls[0]?.url ?? "", /\/api\/works\?/);
  assert.deepEqual(result.works, [
    {
      id: "25-001",
      iabCode: "25-001",
      title: "Landing work",
      subtitle: "Asset title",
      imageLabel: "Opening page",
      thumbnailIdentifier: "25-001/folio 1 recto.tif",
      thumbnailUrl: `${IIIF_IMAGE_BASE_URL}/25-001%2Ffolio%201%20recto.tif/full/256,/0/default.png`,
    },
  ]);
});

test("IIIF thumbnail helpers create canonical src and srcset URLs", () => {
  const identifier = "25-001/folio 1 recto.tif";

  assert.equal(
    iiifImageUrlForIdentifier(identifier, { width: 384 }),
    `${IIIF_IMAGE_BASE_URL}/25-001%2Ffolio%201%20recto.tif/full/384,/0/default.png`,
  );
  assert.equal(
    iiifThumbnailSrcSetForIdentifier(identifier, { widths: [256, 512] }),
    [
      `${IIIF_IMAGE_BASE_URL}/25-001%2Ffolio%201%20recto.tif/full/256,/0/default.png 256w`,
      `${IIIF_IMAGE_BASE_URL}/25-001%2Ffolio%201%20recto.tif/full/512,/0/default.png 512w`,
    ].join(", "),
  );
  assert.equal(
    iiifInfoJsonUrlForIdentifier(identifier),
    `${IIIF_IMAGE_BASE_URL}/25-001%2Ffolio%201%20recto.tif/info.json`,
  );
});

test("getWorks leaves landing-page thumbnail data empty when a work has no image identifier", async () => {
  mockFetch({
    data: [
      {
        id: 11,
        iabCode: "25-002",
        displayTitle: "Work without a thumbnail",
        iiif_assets: [
          {
            title: "Asset without images",
            images: [],
          },
        ],
      },
    ],
  });

  const result = await getWorks(1);

  assert.equal(result.works[0]?.title, "Work without a thumbnail");
  assert.equal(result.works[0]?.thumbnailUrl, undefined);
  assert.equal(result.works[0]?.imageLabel, undefined);
});

test("getWorkByIabCode returns every work-page IIIF image sorted by sequence", async () => {
  mockFetch({
    data: [
      {
        iabCode: "25-003",
        titleEn: "Detailed work",
        iiif_assets: [
          {
            images: [
              {
                sequence: 3,
                label: "Third image",
                infoJsonUrl: "https://example.test/third/info.json",
                cantaloupeIdentifier: "25-003/third.tif",
              },
              {
                sequence: 1,
                label: "First image",
                infoJsonUrl: "https://example.test/first/info.json",
                cantaloupeIdentifier: "25-003/first.tif",
              },
            ],
          },
          {
            attributes: {
              images: {
                data: [
                  {
                    attributes: {
                      sequence: 2,
                      label: "Second image",
                      infoJsonUrl: "https://example.test/second/info.json",
                      cantaloupeIdentifier: "25-003/second.tif",
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  });

  const result = await getWorkByIabCode("25-003");

  assert.deepEqual(
    result.work?.images.map((image) => ({
      sequence: image.sequence,
      label: image.label,
      infoJsonUrl: image.infoJsonUrl,
      cantaloupeIdentifier: image.cantaloupeIdentifier,
    })),
    [
      {
        sequence: 1,
        label: "First image",
        infoJsonUrl: `${IIIF_IMAGE_BASE_URL}/25-003%2Ffirst.tif/info.json`,
        cantaloupeIdentifier: "25-003/first.tif",
      },
      {
        sequence: 2,
        label: "Second image",
        infoJsonUrl: `${IIIF_IMAGE_BASE_URL}/25-003%2Fsecond.tif/info.json`,
        cantaloupeIdentifier: "25-003/second.tif",
      },
      {
        sequence: 3,
        label: "Third image",
        infoJsonUrl: `${IIIF_IMAGE_BASE_URL}/25-003%2Fthird.tif/info.json`,
        cantaloupeIdentifier: "25-003/third.tif",
      },
    ],
  );
});
