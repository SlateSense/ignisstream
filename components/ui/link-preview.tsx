"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import Image from "next/image";

interface LinkPreviewProps {
  url: string;
  className?: string;
}

interface LinkMetadata {
  title: string;
  description: string;
  image: string;
  url: string;
  siteName?: string;
}

export default function LinkPreview({ url, className }: LinkPreviewProps) {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchMetadata();
  }, [url]);

  const fetchMetadata = async () => {
    try {
      // Call your API endpoint that fetches Open Graph data
      const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) throw new Error("Failed to fetch metadata");
      
      const data = await response.json();
      setMetadata(data);
    } catch (err) {
      console.error("Error fetching link preview:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <div className="p-4 animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (error || !metadata) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary hover:underline"
      >
        {url}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        {metadata.image && (
          <div className="relative w-full h-48">
            <Image
              src={metadata.image}
              alt={metadata.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                {metadata.title}
              </h3>
              {metadata.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {metadata.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {metadata.siteName && <span>{metadata.siteName}</span>}
                <ExternalLink className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </a>
  );
}

// Utility function to extract URLs from text
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

// Component to render text with link previews
export function TextWithLinkPreviews({ text }: { text: string }) {
  const urls = extractUrls(text);
  
  if (urls.length === 0) {
    return <p className="whitespace-pre-wrap">{text}</p>;
  }

  return (
    <div className="space-y-4">
      <p className="whitespace-pre-wrap">{text}</p>
      {urls.slice(0, 3).map((url, index) => (
        <LinkPreview key={index} url={url} />
      ))}
    </div>
  );
}
