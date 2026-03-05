// src/lib/authBootstrap.ts
import { raw, API_PREFIX } from "./Axios";
import { store } from "../redux/store";
import { setUser, setLoading, logout, setHydrated } from "../redux/slices/auth.slice";

export async function bootstrapAuth() {
  try {
    store.dispatch(setLoading(true));

    // ✅ cookie session check
    const res = await raw.get(`${API_PREFIX}/auth/me`);
    const user = (res as any).data?.user ?? (res as any).data?.data ?? null;

    if (user) {
      store.dispatch(setUser(user));
    } else {
      store.dispatch(logout());
    }
  } catch {
    store.dispatch(logout());
  } finally {
    store.dispatch(setLoading(false));
    store.dispatch(setHydrated(true));
  }
}
