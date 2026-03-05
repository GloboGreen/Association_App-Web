// src/lib/Axios.ts
import axios, { AxiosError } from "axios";
import { baseURL } from "../constants/SummaryApi";
import { store } from "../redux/store";
import { logout, setUser } from "../redux/slices/auth.slice";

const API_BASE = import.meta.env.VITE_API_BASE ?? baseURL ?? "";
export const API_PREFIX = "/api";

// ✅ raw client: used for session checks & refresh
export const raw = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ✅ MUST for cookie auth
});

// ✅ main client for all app APIs
const Axios = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ✅ MUST for cookie auth
});

// ✅ optional: handle 401 globally
Axios.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as any;

    // do not loop on auth endpoints
    const url = String(original?.url ?? "");
    const isAuthEndpoint =
      url.includes("/auth/me") ||
      url.includes("/auth/login") ||
      url.includes("/auth/google") ||
      url.includes("/auth/logout");

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;

      try {
        // try restoring session via cookie
        const me = await raw.get(`${API_PREFIX}/auth/me`);
        const user = (me as any).data?.user ?? (me as any).data?.data ?? null;

        if (user) {
          store.dispatch(setUser(user));
          return Axios(original); // retry original request
        }
      } catch {
        // ignore
      }

      store.dispatch(logout());
    }

    return Promise.reject(error);
  }
);

export default Axios;
