"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { rememberAuthenticatedRoute } from "@/lib/auth/session";

const shouldTrackRoute = (pathname: string) => {
  if (!pathname) {
    return false;
  }

  return !pathname.startsWith("/auth") && !pathname.startsWith("/api");
};

export function SessionExperienceProvider() {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !pathname || !shouldTrackRoute(pathname)) {
      return;
    }

    const query = typeof window === "undefined" ? "" : window.location.search;
    rememberAuthenticatedRoute(query ? `${pathname}?${query}` : pathname);
  }, [pathname, user]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  return null;
}
