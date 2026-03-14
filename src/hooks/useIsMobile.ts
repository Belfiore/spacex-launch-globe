"use client";

import { useSyncExternalStore } from "react";

// Use useSyncExternalStore for SSR-safe initial value that avoids layout flash
function getIsMobileSnapshot(breakpoint: number) {
  return () => window.innerWidth < breakpoint;
}

function getServerSnapshot() {
  return false; // SSR fallback — components render desktop first on server
}

function subscribeToResize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

export function useIsMobile(breakpoint = 768) {
  // useSyncExternalStore reads window.innerWidth synchronously on first client render,
  // avoiding the useEffect delay that causes mobile layout flash
  return useSyncExternalStore(
    subscribeToResize,
    getIsMobileSnapshot(breakpoint),
    getServerSnapshot
  );
}
