"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Session sidebar search box state with a 300ms debounce.
 * Returns the debounced value plus a ref for use inside event/socket callbacks.
 */
export function useChatSessionSearch() {
  const [sessionSearch, setSessionSearch] = useState("");
  const [debouncedSessionSearch, setDebouncedSessionSearch] = useState("");
  const debouncedSessionSearchRef = useRef("");

  useEffect(() => {
    debouncedSessionSearchRef.current = debouncedSessionSearch;
  }, [debouncedSessionSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSessionSearch(sessionSearch.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [sessionSearch]);

  const resetSessionSearch = useCallback(() => {
    setSessionSearch("");
    setDebouncedSessionSearch("");
  }, []);

  return {
    sessionSearch,
    setSessionSearch,
    debouncedSessionSearch,
    debouncedSessionSearchRef,
    resetSessionSearch,
  };
}
