import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

import SummaryApi, { baseURL } from "../../constants/SummaryApi";

export type Role = "OWNER" | "USER" | "EMPLOYEE";

export interface User {
  _id: string;
  name?: string;
  email?: string;
  mobile?: string;
  additionalNumber?: string;
  avatar?: string;
  role?: Role;

  qrCodeUrl?: string;

  shopName?: string;
  shopFront?: string;
  shopBanner?: string;

  shopAddress?: {
    street?: string;
    area?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };

  BusinessType?: string;
  BusinessCategory?: string;
  RegistrationNumber?: string;

  profilePercent?: number;
  profileBreakdown?: {
    profileBasics: number;
    memberAddress: number;
    shopBasic: number;
    shopAddress: number;
    shopPhotos: number;
    businessDetails: number;
    total: number;
  };

  isProfileVerified?: boolean;
  shopCompleted?: boolean;

  address?: {
    street?: string;
    area?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  addressUpdatedAt?: string;

  association?:
    | string
    | {
        _id: string;
        name: string;
        district: string;
        area?: string;
        logo?: string;
        isActive?: boolean;
      };

  owner?:
    | string
    | {
        _id: string;
        name?: string;
        shopName?: string;
        shopBanner?: string;
        shopAddress?: {
          street?: string;
          area?: string;
          city?: string;
          district?: string;
          state?: string;
          pincode?: string;
        };
        isProfileVerified?: boolean;
        shopCompleted?: boolean;
      };

  ownerVerified?: boolean;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // prevent duplicate refresh storms
  const refreshingRef = useRef(false);

  // epoch to invalidate in-flight refresh calls after logout/login
  const authEpochRef = useRef(0);

  const hardClearState = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  /* ---------------------------------------------------------
   * INTERNAL: Refresh using a given token
   ---------------------------------------------------------- */
  const refreshUserWithToken = useCallback(
    async (t: string) => {
      if (!t) return;
      if (refreshingRef.current) return;

      const myEpoch = authEpochRef.current;

      try {
        refreshingRef.current = true;

        const res = await fetch(`${baseURL}${SummaryApi.current_user.url}`, {
          method: SummaryApi.current_user.method,
          headers: {
            Authorization: `Bearer ${t}`,
          },
        });

        let data: any = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        // If logout/login happened while request was in-flight, ignore
        if (myEpoch !== authEpochRef.current) return;

        if (!res.ok || !data?.success || !data?.user) {
          console.log("refreshUser failed:", data);

          // IMPORTANT: No navigation here. Only clear auth.
          if (res.status === 401) {
            await AsyncStorage.multiRemove(["user", "accessToken"]);
            hardClearState();
          }
          return;
        }

        const freshUser = data.user as User;

        // apply only if still same epoch
        if (myEpoch !== authEpochRef.current) return;

        setUser(freshUser);
        setToken(t);
        await AsyncStorage.setItem("user", JSON.stringify(freshUser));
      } catch (err) {
        console.log("refreshUserWithToken error:", err);
      } finally {
        refreshingRef.current = false;
      }
    },
    [hardClearState]
  );

  /* ---------------------------------------------------------
   * 1) HYDRATE FROM STORAGE
   ---------------------------------------------------------- */
  useEffect(() => {
    const hydrate = async () => {
      try {
        setLoading(true);

        const [[, userValue], [, tokenValue]] = await AsyncStorage.multiGet([
          "user",
          "accessToken",
        ]);

        if (userValue && tokenValue) {
          const parsedUser = JSON.parse(userValue) as User;
          setUser(parsedUser);
          setToken(tokenValue);

          // pull latest from backend after hydrate
          await refreshUserWithToken(tokenValue);
        } else {
          hardClearState();
        }
      } catch (err) {
        console.log("Auth hydrate error:", err);
        hardClearState();
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, [hardClearState, refreshUserWithToken]);

  /* ---------------------------------------------------------
   * 2) SET AUTH
   ---------------------------------------------------------- */
  const setAuth = useCallback(async (u: User, t: string) => {
    try {
      authEpochRef.current += 1; // new session epoch

      setUser(u);
      setToken(t);

      await AsyncStorage.multiSet([
        ["user", JSON.stringify(u)],
        ["accessToken", t],
      ]);

      // Optional: fetch latest profile after login (safe)
      await refreshUserWithToken(t);
    } catch (err) {
      console.log("setAuth error:", err);
    }
  }, [refreshUserWithToken]);

  /* ---------------------------------------------------------
   * 3) CLEAR AUTH
   ---------------------------------------------------------- */
  const clearAuth = useCallback(async () => {
    try {
      authEpochRef.current += 1; // invalidate all in-flight refresh calls
      refreshingRef.current = false;

      hardClearState();
      await AsyncStorage.multiRemove(["user", "accessToken"]);
    } catch (err) {
      console.log("clearAuth error:", err);
    }
  }, [hardClearState]);

  /* ---------------------------------------------------------
   * 4) PUBLIC REFRESH USER
   ---------------------------------------------------------- */
  const refreshUser = useCallback(async () => {
    try {
      const storedToken = token || (await AsyncStorage.getItem("accessToken"));
      if (!storedToken) return;

      await refreshUserWithToken(storedToken);
    } catch (err) {
      console.log("refreshUser error:", err);
    }
  }, [token, refreshUserWithToken]);

  /* ---------------------------------------------------------
   * 5) REFRESH ON APP RESUME
   ---------------------------------------------------------- */
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshUser();
      }
    });

    return () => sub.remove();
  }, [refreshUser]);

  const value = useMemo(
    () => ({ user, token, loading, setAuth, clearAuth, refreshUser }),
    [user, token, loading, setAuth, clearAuth, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthProvider;
