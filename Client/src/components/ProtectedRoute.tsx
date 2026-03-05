import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import type { RootState } from "../redux/store";
import type { Role } from "../redux/slices/auth.slice";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: Role | Role[];
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, loading, hydrated } = useSelector((s: RootState) => s.auth);
  const location = useLocation();

  if (!hydrated || loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-4 text-center backdrop-blur">
          <p className="text-sm text-white/80">Checking session...</p>
          <p className="mt-1 text-xs text-white/50">Please wait</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    const userRole = user.role;

    if (!userRole) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (!allowed.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
