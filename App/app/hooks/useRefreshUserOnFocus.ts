import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";

type OnFocusFn = (() => void) | (() => Promise<void>);

/**
 * Refresh user whenever screen is focused.
 * ✅ Does NOT run while auth is restoring
 * ✅ Does NOT run if token missing (logged out)
 * ✅ Optionally runs `onFocus()` after refresh
 */
export function useRefreshUserOnFocus(onFocus?: OnFocusFn) {
  const { refreshUser, token, loading } = useAuth();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      // ✅ very important guards (prevents loops)
      if (loading) return () => {};
      if (!token) return () => {};

      (async () => {
        try {
          await refreshUser();
        } catch {}

        if (!isActive) return;

        if (onFocus) {
          try {
            await onFocus();
          } catch {}
        }
      })();

      return () => {
        isActive = false;
      };
    }, [refreshUser, token, loading, onFocus])
  );
}
