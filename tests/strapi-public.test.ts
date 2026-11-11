import assert from "node:assert/strict";
import { test } from "node:test";

test("public production requests omit the configured token across works endpoints", async () => {
  const originalToken = process.env.STRAPI_API_TOKEN;
  const originalFetch = globalThis.fetch;
  process.env.STRAPI_API_TOKEN = "token-for-configured-cms";
  try {
    const { getWorks, getWorkByIabCode, getAdjacentWorks } = await import("../src/lib/works");
    const { getEnvironmentConfig } = await import("../src/lib/config");
    const headers: Headers[] = [];
    globalThis.fetch = (async (_input, init) => {
      headers.push(new Headers(init?.headers));
      return Response.json({ data: [] });
    }) as typeof fetch;

    const production = getEnvironmentConfig("production");
    await getWorks(1, "", "", production);
    await getWorkByIabCode("25-001", production);
    await getAdjacentWorks("25-001", production);
    assert.equal(headers.length, 4);
    for (const header of headers) assert.equal(header.has("Authorization"), false);

    await getWorks(1, "", "", getEnvironmentConfig("staging"));
    assert.equal(headers[4].get("Authorization"), "Bearer token-for-configured-cms");

    globalThis.fetch = (async () => new Response("Unavailable", {
      status: 503, statusText: "Service Unavailable",
    })) as typeof fetch;
    await assert.rejects(getWorks(1, "", "", production), /STRAPI_API_TOKEN configured: no/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalToken === undefined) delete process.env.STRAPI_API_TOKEN;
    else process.env.STRAPI_API_TOKEN = originalToken;
  }
});
