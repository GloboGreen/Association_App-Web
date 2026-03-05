import { Outlet } from "react-router-dom";
import Topbar from "@/components/Topbar";

export default function AdminLayout() {
  return (
    <div className="relative min-h-screen text-slate-900">
      {/* Gradient image-style background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700" />

        {/* Soft white overlay (keeps cards readable) */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]" />

        {/* Gradient blobs (image-like depth) */}
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-pink-400/40 blur-3xl" />
        <div className="absolute top-1/4 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/40 blur-3xl" />
        <div className="absolute bottom-[-200px] left-1/3 h-[500px] w-[500px] rounded-full bg-purple-500/40 blur-3xl" />
      </div>

      {/* Top navigation */}
      <Topbar />

      {/* Page content */}
      <main className="mx-auto w-full max-w-7xl px-3 sm:px-4 pb-10 pt-5">
        <Outlet />
      </main>
    </div>
  );
}
