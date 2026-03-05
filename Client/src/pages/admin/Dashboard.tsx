  import { useEffect, useState } from "react";
  import type { ComponentType } from "react";
  import type { LucideProps } from "lucide-react";
  import {
    Users,
    Building2,
    FileClock,
    CreditCard,
    BadgeCheck,
    XCircle,
    IndianRupee,
    TrendingUp,
    CalendarClock,
    RefreshCcw,
  } from "lucide-react";
  import axios from "axios";

  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import Axios from "@/lib/Axios";
  import SummaryApi from "@/constants/SummaryApi";

  /* ---------------- TYPES ---------------- */

  type Stats = {
    totalUsers: number;
    totalAssociations: number;

    kycPending: number;
    kycApproved: number;
    kycRejected: number;

    activeSubscriptions: number; // PAID
    failedSubscriptions: number; // FAILED
    paidThisMonth: number;
    failedThisMonth: number;

    totalSubscriptionAmount: number;
    totalMeetingAmount: number;
    totalCollected: number;
  };

  type IconType = ComponentType<LucideProps>;

  type ApiResponse<T> = {
    success: boolean;
    stats: T;
    message?: string;
  };

  /* ---------------- HELPERS ---------------- */

  function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as { message?: string } | undefined;
      return data?.message ?? "Failed to load dashboard data";
    }
    if (error instanceof Error) return error.message;
    return "Unexpected error occurred";
  }

  const money = (n: number) => `₹ ${new Intl.NumberFormat("en-IN").format(n)}`;

  /* ---------------- UI ---------------- */

  function GradientBadge({ icon: Icon }: { icon: IconType }) {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-pink-500 p-[1px]">
        <div className="grid place-items-center rounded-2xl bg-white p-3">
          <Icon className="h-6 w-6 text-slate-900" />
        </div>
      </div>
    );
  }

  function StatCard({
    icon,
    label,
    value,
    hint,
  }: {
    icon: IconType;
    label: string;
    value: number | string;
    hint?: string;
  }) {
    return (
      <Card className="rounded-2xl border border-white/10 bg-white shadow-sm">
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </p>
            {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
          <GradientBadge icon={icon} />
        </CardContent>
      </Card>
    );
  }

  function SummaryRow({
    label,
    value,
  }: {
    label: string;
    value: number | string;
  }) {
    return (
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3 last:border-b-0">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-sm font-semibold text-slate-900">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
      </div>
    );
  }

  function SummaryHeader({
    icon: Icon,
    title,
    subtitle,
  }: {
    icon: IconType;
    title: string;
    subtitle: string;
  }) {
    return (
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-pink-500 text-white">
              <Icon className="h-4 w-4" />
            </span>
            {title}
          </CardTitle>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
    );
  }

  /* ---------------- DASHBOARD ---------------- */

  export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const res = await Axios.request<ApiResponse<Stats>>({
          method: SummaryApi.admin_stats.method,
          url: SummaryApi.admin_stats.url,
        });

        if (res.data.success) setStats(res.data.stats);
        else setError(res.data.message ?? "Failed to load dashboard");
      } catch (e: unknown) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchStats();
    }, []);

    return (
      <div className="min-h-[calc(100dvh-120px)]">
        {/* Background (premium) */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl" />
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-pink-500/15 blur-3xl" />
          </div>

          {/* Header */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent">
                Admin Dashboard
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Real-time overview of users, associations, KYC and subscriptions.
              </p>
            </div>

            <button
              onClick={fetchStats}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {/* States */}
          {loading && <p className="text-sm text-slate-500">Loading…</p>}
          {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

          {stats && !loading && (
            <div className="space-y-6">
              {/* Top cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={Users} label="TOTAL USERS" value={stats.totalUsers} />
                <StatCard icon={Building2} label="ASSOCIATIONS" value={stats.totalAssociations} />
                <StatCard icon={FileClock} label="PENDING KYC / DOCS" value={stats.kycPending} />
                <StatCard icon={CreditCard} label="PAID SUBSCRIPTIONS" value={stats.activeSubscriptions} />
              </div>

              {/* Summary cards */}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="border-b border-slate-200 px-6 py-4">
                    <SummaryHeader
                      icon={TrendingUp}
                      title="Association Summary"
                      subtitle="Overview of association and verification status"
                    />
                  </CardHeader>
                  <CardContent className="p-0">
                    <SummaryRow label="Total Associations" value={stats.totalAssociations} />
                    <SummaryRow label="KYC Approved" value={stats.kycApproved} />
                    <SummaryRow label="KYC Pending" value={stats.kycPending} />
                    <SummaryRow label="KYC Rejected" value={stats.kycRejected} />
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="border-b border-slate-200 px-6 py-4">
                    <SummaryHeader
                      icon={CalendarClock}
                      title="Subscription & Billing Summary"
                      subtitle="Monthly collections and payment status"
                    />
                  </CardHeader>
                  <CardContent className="p-0">
                    <SummaryRow label="Paid Subscriptions (Total)" value={stats.activeSubscriptions} />
                    <SummaryRow label="Failed Subscriptions (Total)" value={stats.failedSubscriptions} />
                    <SummaryRow label="Paid This Month" value={stats.paidThisMonth} />
                    <SummaryRow label="Failed This Month" value={stats.failedThisMonth} />
                  </CardContent>
                </Card>
              </div>

              {/* Bottom highlights */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard icon={BadgeCheck} label="TOTAL SUBSCRIPTION AMOUNT" value={money(stats.totalSubscriptionAmount)} />
                <StatCard icon={XCircle} label="TOTAL MEETING AMOUNT" value={money(stats.totalMeetingAmount)} />
                <StatCard icon={IndianRupee} label="TOTAL COLLECTED" value={money(stats.totalCollected)} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
    