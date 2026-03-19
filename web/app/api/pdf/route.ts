export const runtime = "edge";

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");

  if (!target || !isHttpUrl(target)) {
    return new Response("Missing or invalid url", { status: 400 });
  }

  const range = request.headers.get("range");
  const upstream = await fetch(target, {
    headers: range ? { range } : undefined,
  });

  // pdf.js expects 200 or 206. Bubble up upstream failures.
  if (!(upstream.status === 200 || upstream.status === 206)) {
    return new Response(`Upstream error (${upstream.status})`, { status: 502 });
  }

  const headers = new Headers();
  headers.set("cache-control", "no-store");

  const passthrough = [
    "content-type",
    "content-length",
    "accept-ranges",
    "content-range",
    "etag",
    "last-modified",
  ] as const;
  for (const key of passthrough) {
    const value = upstream.headers.get(key);
    if (value) headers.set(key, value);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}

