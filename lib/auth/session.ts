"use client";

export const AUTH_PERSISTENCE_KEY = "ignisstream.auth.remember-me";
export const LAST_AUTHENTICATED_ROUTE_KEY = "ignisstream.auth.last-route";

const isSafePath = (value: string | null | undefined) => {
  return Boolean(
    value &&
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !value.startsWith("/auth") &&
      !value.startsWith("/api")
  );
};

export const getRememberMePreference = () => {
  if (typeof window === "undefined") {
    return true;
  }

  const value = window.localStorage.getItem(AUTH_PERSISTENCE_KEY);
  if (value === null) {
    return true;
  }

  return value === "true";
};

export const setRememberMePreference = (value: boolean) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_PERSISTENCE_KEY, String(value));
};

export const rememberAuthenticatedRoute = (path: string) => {
  if (typeof window === "undefined" || !isSafePath(path)) {
    return;
  }

  window.localStorage.setItem(LAST_AUTHENTICATED_ROUTE_KEY, path);
};

export const getRememberedAuthenticatedRoute = () => {
  if (typeof window === "undefined") {
    return "/feed";
  }

  const rememberedPath = window.localStorage.getItem(LAST_AUTHENTICATED_ROUTE_KEY);
  return isSafePath(rememberedPath) ? rememberedPath! : "/feed";
};

export const clearRememberedAuthenticatedRoute = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LAST_AUTHENTICATED_ROUTE_KEY);
};
