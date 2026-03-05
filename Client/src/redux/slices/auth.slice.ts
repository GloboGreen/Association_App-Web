// src/redux/slices/auth.slice.ts

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, AuthUser, Role } from "@/types/auth";

export type { Role };

/**
 * Auth state
 * hydrated = true ONLY after bootstrapAuth finishes
 */
const initialState: AuthState & { hydrated: boolean } = {
  user: null,
  token: null,
  loading: false,
  error: null,
  hydrated: false,
};

interface LoginPayload {
  user: AuthUser;
  token: string;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /* ---------------- HYDRATION ---------------- */
    setHydrated: (state, action: PayloadAction<boolean>) => {
      state.hydrated = action.payload;
    },

    /* ---------------- LOGIN ---------------- */
    setCredentials: (state, action: PayloadAction<LoginPayload>) => {
      const { user, token } = action.payload;

      state.user = {
        ...user,
        provider: user.provider ?? "local",
      };
      state.token = token;
      state.loading = false;
      state.error = null;
    },

    setGoogleCredentials: (state, action: PayloadAction<LoginPayload>) => {
      const { user, token } = action.payload;

      state.user = {
        ...user,
        provider: "google",
      };
      state.token = token;
      state.loading = false;
      state.error = null;
    },

    /* ---------------- USER UPDATE ---------------- */
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      const incoming = action.payload;

      if (!incoming) {
        state.user = null;
        state.token = null;
        return;
      }

      state.user = {
        ...incoming,
        provider: incoming.provider ?? "local",
      };
      state.error = null;
    },

    /* ---------------- LOADING / ERROR ---------------- */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    /* ---------------- LOGOUT / CLEAR ---------------- */
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      state.hydrated = true; // 🔥 prevent redirect loop
    },

    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      state.hydrated = true;
    },
  },
});

export const {
  setHydrated,
  setCredentials,
  setGoogleCredentials,
  setUser,
  setLoading,
  logout,
  clearAuth,
  setAuthLoading,
  setAuthError,
} = authSlice.actions;

export default authSlice.reducer;
