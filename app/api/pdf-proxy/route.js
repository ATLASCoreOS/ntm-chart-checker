import { auth } from "@/lib/auth";
import { USER_AGENT } from "@/lib/constants";

export const maxDuration = 30;

/**
 * Proxy endpoint for UKHO PDF files.
 * Only allows requests from authenticated users and only proxies from msi.admiralty.co.uk.
 * GET /api/pdf-proxy?url=<encoded-url>
 */
export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pdfUrl = searchParams.get("url");

  if (!pdfUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }

  // Only allow Admiralty domain
  try {
    const parsed = new URL(pdfUrl);
    if (parsed.hostname !== "msi.admiralty.co.uk") {
      return new Response("Forbidden domain", { status: 403 });
    }
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  try {
    const res = await fetch(pdfUrl, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!res.ok) {
      return new Response(`Upstream error: ${res.status}`, { status: 502 });
    }

    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    return new Response(`Proxy error: ${err.message}`, { status: 502 });
  }
}
