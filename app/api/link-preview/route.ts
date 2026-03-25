import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch the page content
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IgnisStream/1.0; +https://ignisstream.com)",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch URL");
    }

    const html = await response.text();

    // Extract Open Graph metadata
    const metadata = {
      title: extractMetaTag(html, "og:title") || extractTag(html, "title") || new URL(url).hostname,
      description: extractMetaTag(html, "og:description") || extractMetaTag(html, "description") || "",
      image: extractMetaTag(html, "og:image") || "",
      url: url,
      siteName: extractMetaTag(html, "og:site_name") || new URL(url).hostname,
    };

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Error fetching link preview:", error);
    return NextResponse.json(
      { error: "Failed to fetch link preview" },
      { status: 500 }
    );
  }
}

function extractMetaTag(html: string, property: string): string | null {
  // Try Open Graph tags first
  const ogRegex = new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']*)["']`, "i");
  const ogMatch = html.match(ogRegex);
  if (ogMatch && ogMatch[1]) return ogMatch[1];

  // Try standard meta tags
  const metaRegex = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, "i");
  const metaMatch = html.match(metaRegex);
  if (metaMatch && metaMatch[1]) return metaMatch[1];

  // Try reversed order (content before name/property)
  const reversedRegex = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["'](?:og:)?${property}["']`, "i");
  const reversedMatch = html.match(reversedRegex);
  if (reversedMatch && reversedMatch[1]) return reversedMatch[1];

  return null;
}

function extractTag(html: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const match = html.match(regex);
  return match && match[1] ? match[1].trim() : null;
}
