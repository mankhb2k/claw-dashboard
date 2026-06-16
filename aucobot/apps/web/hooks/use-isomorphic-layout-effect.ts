import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` on the client, `useEffect` during SSR.
 * Avoids the "useLayoutEffect does nothing on the server" warning while still
 * running synchronously before paint in the browser (needed for layout reads
 * like textarea auto-resize so there is no visible height flicker).
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
