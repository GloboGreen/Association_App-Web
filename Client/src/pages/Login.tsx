import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation, type Location } from "react-router-dom";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import axios from "axios";
import { Mail, Lock, Eye, EyeOff, LogIn, ShieldCheck, AlertCircle } from "lucide-react";

import Axios from "../lib/Axios";
import SummaryApi from "../constants/SummaryApi";
import { setCredentials, setLoading } from "../redux/slices/auth.slice";

/** Location state type (removes `as any`) */
type LocationState = {
  from?: Location;
};

/** Safe API error message parser */
function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

/** Persist token to enable refresh/reload restore */
function persistToken(token?: string) {
  if (!token) return;
  localStorage.setItem("authToken", token);
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ✅ typed location
  const location = useLocation() as Location & { state?: LocationState };
  const from = location.state?.from?.pathname || "/admin";

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.trim().length > 0,
    [email, password]
  );

  const onLocalLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    dispatch(setLoading(true));

    try {
      const { data } = await Axios.request({
        method: SummaryApi.login.method,
        url: SummaryApi.login.url,
        data: { email, password },
      });

      /**
       * Expected response (example):
       * { success: true, user: {...}, token: "..." }
       */
      if (data?.success && data?.user) {
        // ✅ CRITICAL for refresh/reload:
        // persist token so bootstrapAuth can restore after F5
        persistToken(data?.token);

        // ✅ store both user + token in redux immediately
        if (data?.token) {
          dispatch(setCredentials({ user: data.user, token: data.token }));
        } else {
          // If backend doesn't return token, refresh will still fail.
          // Keep user in state so navigation works, but you must fix backend contract.
          dispatch(setCredentials({ user: data.user, token: "" }));
        }

        navigate(from, { replace: true });
      } else {
        setError(data?.message || "Login failed");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const onGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setError(null);

      const credential = credentialResponse.credential;
      if (!credential) throw new Error("Missing Google credential");

      dispatch(setLoading(true));

      const { data } = await Axios.request({
        method: SummaryApi.google_login.method,
        url: SummaryApi.google_login.url,
        data: { idToken: credential },
      });

      /**
       * Expected response (example):
       * { success: true, user: {...}, token: "..." }
       */
      if (data?.success && data?.user) {
        // ✅ CRITICAL for refresh/reload:
        persistToken(data?.token);

        // ✅ store both user + token
        if (data?.token) {
          dispatch(setCredentials({ user: data.user, token: data.token }));
        } else {
          dispatch(setCredentials({ user: data.user, token: "" }));
        }

        navigate(from, { replace: true });
      } else {
        setError(data?.message || "Google login failed");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Google login failed"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-[100dvh] grid place-items-center px-4 py-6 bg-[#0b1220]">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl bg-blue-600/20" />
        <div className="absolute -top-24 -right-40 h-[520px] w-[520px] rounded-full blur-3xl bg-pink-500/20" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[420px] w-[720px] rounded-full blur-3xl bg-white/5" />
      </div>

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left (desktop only) */}
        <div className="hidden lg:block rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/35 to-pink-500/20 shadow-[0_18px_60px_rgba(0,0,0,.45)] overflow-hidden relative">
          <div className="p-6 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-4 py-2 backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-bold">TN Tech Connect</span>
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight">Admin Console</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/85 max-w-md">
              Secure access for administrators. Sign in to manage users, shops, and KYC workflows.
            </p>
          </div>

          <div className="absolute -top-24 -right-24 h-[420px] w-[420px] rounded-full bg-white/20 blur-2xl" />
        </div>

        {/* Right card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,.45)] p-6 text-white">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Admin Login</h1>
            <p className="mt-1 text-sm text-white/75">Use your admin credentials to continue.</p>
          </div>

          <form onSubmit={onLocalLogin} className="mt-5 space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs text-white/80">Email</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 focus-within:border-white/20">
                <Mail className="h-4 w-4 text-white/80" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                  className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-white/35"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-white/80">Password</label>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 focus-within:border-white/20">
                <Lock className="h-4 w-4 text-white/80" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-white/35"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 font-bold transition
                         bg-gradient-to-r from-blue-600 to-pink-500 hover:brightness-110 active:brightness-95
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-white/60">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Google */}
            <div className="flex justify-center">
              <GoogleLogin onSuccess={onGoogleSuccess} onError={() => setError("Google login failed")} />
            </div>

            {/* Error */}
            {error && (
              <div className="mt-2 flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-white/90">
                <AlertCircle className="h-5 w-5 text-red-200" />
                <p className="leading-snug">{error}</p>
              </div>
            )}
          </form>

          <p className="mt-4 text-xs text-white/55">By continuing, you agree to the platform security policies.</p>
        </div>
      </div>
    </div>
  );
}
