import { promisify } from "node:util";
import { gzip } from "node:zlib";
import { onResponse } from "h3";

const gzipAsync = promisify(gzip);

export const compressionMiddleware = onResponse(async (response, event) => {
  if (response.headers.get("content-type")?.includes("application/json")) {
    const acceptEncoding = event.req.headers.get("accept-encoding");

    if (acceptEncoding?.includes("gzip")) {
      const originalBody = await response.text();
      const compressed = await gzipAsync(originalBody);

      return new Response(compressed, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers),
          "content-encoding": "gzip",
          "content-length": compressed.length.toString(),
        },
      });
    }
  }

  return response;
});
