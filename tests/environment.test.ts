import assert from "node:assert/strict";
import { test, afterEach } from "node:test";
import * as config from "../src/lib/config";
import { getWorks, getWorkByIabCode, getAdjacentWorks } from "../src/lib/works";
import { getIiifImages } from "../src/lib/iiif-images";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test("a new browser uses staging even when local URLs are configured", () => {
  const resolve = config.resolveEnvironment;
  assert.equal(resolve(undefined), "staging");
  assert.equal(resolve("invalid"), "staging");
  assert.equal(resolve("production"), "production");
  assert.equal(resolve("configured"), "configured");
  assert.equal(config.getEnvironmentConfig(resolve(undefined)).iiifImageBaseUrl,
    "https://iiif-staging-almadar.biennale.org.sa/iiif/3");
});

test("each environment routes all CMS requests and detail images to the matching hosts", async () => {
  for (const [environment, cms, iiif] of [
    ["staging", "https://cms-staging-almadar.biennale.org.sa", "https://iiif-staging-almadar.biennale.org.sa/iiif/3"],
    ["production", "https://cms-almadar.biennale.org.sa", "https://iiif-almadar.biennale.org.sa/iiif/3"],
  ]) {
    const selected = config.getEnvironmentConfig(environment);
    const urls: string[] = [];
    globalThis.fetch = (async (input: string | URL | Request) => {
      urls.push(String(input));
      return Response.json({ data: [{ iabCode: "25-001", iiif_assets: [{ images: [{ cantaloupeIdentifier: "image.tif" }] }] }] });
    }) as typeof fetch;
    const works = await getWorks(1, "", "", selected);
    const detail = await getWorkByIabCode("25-001", selected);
    await getAdjacentWorks("25-001", selected);
    await getIiifImages(1, selected);
    assert.equal(urls.length, 5);
    for (const url of urls) assert.equal(new URL(url).origin, cms);
    assert.equal(works.works[0].thumbnailUrl, `${iiif}/image.tif/full/256,/0/default.png`);
    assert.ok(detail.work);
    assert.equal(detail.work.images[0].infoJsonUrl, `${iiif}/image.tif/info.json`);
  }
});
