// src/pages/admin/UserList.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Axios from "@/lib/Axios";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

import {
  Loader2,
  Eye,
  Trash2,
  ShieldCheck,
  ShieldX,
  Clock3,
  FileText,
  BadgeCheck,
  BadgeX,
} from "lucide-react";

import SummaryApi from "@/constants/SummaryApi";

/* ---------------- TYPES ---------------- */

type Address = {
  city?: string;
  district?: string;
  state?: string;
};

type KycStatus =
  | "NOT_SUBMITTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | string;

type User = {
  _id: string;
  name: string;
  email?: string;

  mobile?: string;
  avatar?: string;

  role: "ADMIN" | "USER" | "OWNER" | "EMPLOYEE" | string;

  BusinessType?: "WHOLESALE" | "RETAIL" | string;
  BusinessCategory?: string;

  last_login_date?: string | null;
  createdAt: string;

  address?: Address;

  // ✅ NEW: Profile completion percent (0-100)
  profilePercent?: number;

  // Profile verification
  isProfileVerified?: boolean;

  // KYC fields (optional)
  kycId?: string;
  kycStatus?: KycStatus;
  kycUpdatedAt?: string | null;
  isKycVerified?: boolean;

  // Optional nested object if you store as kyc doc
  kyc?: {
    status?: KycStatus;
    updatedAt?: string;
  };
};

const ITEMS_PER_PAGE = 10;

/* ---------------- HELPERS ---------------- */

function initials(name: string) {
  return (
    name
      ?.trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U"
  );
}

function safeDateLabel(dt?: string | null) {
  if (!dt) return "Never";
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return "—";
  }
}

function clampPercent(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function getKycMeta(status: KycStatus) {
  const s = String(status || "").toUpperCase();

  if (s === "APPROVED") {
    return {
      label: "APPROVED",
      dot: "bg-emerald-500",
      badge: "bg-emerald-600 text-white",
      Icon: BadgeCheck,
    };
  }
  if (s === "REJECTED") {
    return {
      label: "REJECTED",
      dot: "bg-rose-500",
      badge: "bg-rose-600 text-white",
      Icon: BadgeX,
    };
  }
  if (s === "PENDING") {
    return {
      label: "PENDING",
      dot: "bg-amber-500",
      badge: "bg-amber-500 text-white",
      Icon: Clock3,
    };
  }

  return {
    label: "NOT SUBMITTED",
    dot: "bg-slate-400",
    badge: "bg-slate-200 text-slate-900",
    Icon: FileText,
  };
}

/* ---------------- UI CELLS ---------------- */

function ProfileProgress({ value = 0 }: { value?: number }) {
  const pct = clampPercent(value);

  return (
    <div className="w-[190px]">
      <div className="relative h-2 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-emerald-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-1 flex justify-center">
        <span className="inline-flex items-center rounded-md bg-emerald-600 px-2 py-[2px] text-[10px] font-semibold text-white">
          {pct}%
        </span>
      </div>
    </div>
  );
}

function KycCell({
  status,
  updatedAt,
  hasDoc,
  isKycVerified,
  busy,
  onToggle,
}: {
  status: KycStatus;
  updatedAt?: string | null;
  hasDoc: boolean;
  isKycVerified: boolean;
  busy: boolean;
  onToggle: (checked: boolean) => void;
}) {
  const meta = getKycMeta(status);
  const Icon = meta.Icon;

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        {/* badge */}
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.badge}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </span>
        </div>

        {/* ✅ remove "Not verified" text; keep switch only */}
        <Switch
          checked={isKycVerified}
          disabled={busy || !hasDoc}
          onCheckedChange={onToggle}
        />
      </div>

      <div className="mt-1 text-[11px] text-muted-foreground">
        {hasDoc ? (
          <>
            Updated:{" "}
            <span className="font-medium text-slate-700">
              {updatedAt ? safeDateLabel(updatedAt) : "-"}
            </span>
          </>
        ) : (
          <>No document</>
        )}
      </div>
    </>
  );
}

function ProfileVerifiedCell({
  verified,
  busy,
  onToggle,
}: {
  verified: boolean;
  busy: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${verified ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-900"
          }`}
      >
        {verified ? (
          <ShieldCheck className="h-3.5 w-3.5" />
        ) : (
          <ShieldX className="h-3.5 w-3.5" />
        )}
        {verified ? "Verified" : "Not Verified"}
      </span>

      <Switch checked={verified} disabled={busy} onCheckedChange={onToggle} />
    </div>
  );
}

/* ---------------- PAGE ---------------- */

export default function UserList() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // ✅ Filter states
  const [filterKyc, setFilterKyc] = useState<
    "ALL" | "APPROVED" | "PENDING" | "REJECTED" | "NOT_SUBMITTED"
  >("ALL");

  const [filterProfile, setFilterProfile] = useState<
    "ALL" | "VERIFIED" | "NOT_VERIFIED"
  >("ALL");

  const [filterBusiness, setFilterBusiness] = useState<
    "ALL" | "WHOLESALE" | "RETAIL"
  >("ALL");

  const [updatingVerifyId, setUpdatingVerifyId] = useState<string | null>(null);
  const [updatingKycId, setUpdatingKycId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await Axios.get(SummaryApi.user_list.url);
        setItems(res.data?.data || []);
      } catch (err) {
        console.error("Failed to load users", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // ✅ Search + Filter combined
  const filtered = useMemo(() => {
    return items.filter((u) => {
      /* ---------- Search ---------- */
      const term = search.trim().toLowerCase();
      if (term) {
        const fullText = `${u.name} ${u.mobile || ""} ${u.BusinessCategory || ""
          } ${u.address?.city || ""} ${u.address?.district || ""} ${u.role || ""
          }`.toLowerCase();

        if (!fullText.includes(term)) return false;
      }

      /* ---------- KYC Filter ---------- */
      const kycStatus = String(
        u.kycStatus || u.kyc?.status || "NOT_SUBMITTED"
      ).toUpperCase();

      if (filterKyc !== "ALL" && kycStatus !== filterKyc) return false;

      /* ---------- Profile Verified Filter ---------- */
      const profileVerified = !!u.isProfileVerified;

      if (filterProfile === "VERIFIED" && !profileVerified) return false;
      if (filterProfile === "NOT_VERIFIED" && profileVerified) return false;

      /* ---------- Business Filter ---------- */
      if (filterBusiness !== "ALL" && u.BusinessType !== filterBusiness)
        return false;

      return true;
    });
  }, [items, search, filterKyc, filterProfile, filterBusiness]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  /* ---------- Profile Verified toggle ---------- */
  const handleToggleProfileVerified = async (id: string, checked: boolean) => {
    try {
      setUpdatingVerifyId(id);

      await Axios.patch(SummaryApi.user_update.url.replace(":id", id), {
        isProfileVerified: checked,
      });

      setItems((prev) =>
        prev.map((u) =>
          u._id === id ? { ...u, isProfileVerified: checked } : u
        )
      );
    } catch (err) {
      console.error("Failed to update profile verified status", err);
      alert("Failed to update profile verified status.");
    } finally {
      setUpdatingVerifyId(null);
    }
  };

  /* ---------- KYC Verified toggle ---------- */
  const handleToggleKycVerified = async (
    userId: string,
    kycId: string,
    checked: boolean
  ) => {
    try {
      setUpdatingKycId(userId);

      const status = checked ? "APPROVED" : "REJECTED";

      await Axios.patch(
        SummaryApi.kyc_admin_review.url.replace(":kycId", kycId),
        { status }
      );

      setItems((prev) =>
        prev.map((u) =>
          u._id === userId
            ? { ...u, kycStatus: status }
            : u
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update KYC");
    } finally {
      setUpdatingKycId(null);
    }
  };


  /* ---------- Delete user ---------- */
  const handleDelete = async (id: string) => {
    const ok = window.confirm(
      "Are you sure you want to delete this user? This action cannot be undone."
    );
    if (!ok) return;

    try {
      setDeletingId(id);
      await Axios.delete(SummaryApi.user_delete.url.replace(":id", id));
      setItems((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      console.error("Failed to delete user", err);
      alert("Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading users...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm">
      {/* ✅ FIXED: Full responsive header (matches your screenshot layout) */}
      <CardHeader className="w-full">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* LEFT */}
          <div>
            <CardTitle className="text-xl font-semibold">Users</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage users, KYC status and profile verification.
            </p>
          </div>

          {/* RIGHT */}
          <div className="w-full lg:max-w-[520px] space-y-2">
            {/* Search */}
            <Input
              className="rounded-xl"
              placeholder="Search by name, mobile, city, role..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* KYC */}
              <select
                className="h-9 rounded-xl border bg-white px-3 text-sm"
                value={filterKyc}
                onChange={(e) => {
                  setFilterKyc(e.target.value as any);
                  setPage(1);
                }}
              >
                <option value="ALL">All KYC</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
                <option value="NOT_SUBMITTED">Not Submitted</option>
              </select>

              {/* Profile */}
              <select
                className="h-9 rounded-xl border bg-white px-3 text-sm"
                value={filterProfile}
                onChange={(e) => {
                  setFilterProfile(e.target.value as any);
                  setPage(1);
                }}
              >
                <option value="ALL">All Profiles</option>
                <option value="VERIFIED">Verified</option>
                <option value="NOT_VERIFIED">Not Verified</option>
              </select>

              {/* Business */}
              <select
                className="h-9 rounded-xl border bg-white px-3 text-sm"
                value={filterBusiness}
                onChange={(e) => {
                  setFilterBusiness(e.target.value as any);
                  setPage(1);
                }}
              >
                <option value="ALL">All Business</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="RETAIL">Retail</option>
              </select>

              {/* Reset */}
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => {
                  setFilterKyc("ALL");
                  setFilterProfile("ALL");
                  setFilterBusiness("ALL");
                  setSearch("");
                  setPage(1);
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ✅ Premium container */}
        <div className="rounded-2xl border bg-white/60 backdrop-blur-xl overflow-hidden">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl">
              <TableRow>
                <TableHead className="w-[60px] text-center">S.No</TableHead>
                <TableHead className="w-[70px]">User</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[260px]">Business</TableHead>
                <TableHead className="w-[210px]">Profile %</TableHead>
                <TableHead className="w-[250px]">KYC</TableHead>
                <TableHead className="w-[240px]">Profile Verified</TableHead>
                <TableHead className="text-right w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {pageItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center">
                    <span className="text-sm text-muted-foreground">
                      No users found.
                    </span>
                  </TableCell>
                </TableRow>
              )}

              {pageItems.map((u, index) => {
                const kycStatus: KycStatus = (u.kycStatus ||
                  u.kyc?.status ||
                  "NOT_SUBMITTED") as KycStatus;

                const kycUpdatedAt = u.kycUpdatedAt || u.kyc?.updatedAt || null;

                const hasDoc =
                  String(kycStatus).toUpperCase() !== "NOT_SUBMITTED";

                const isKycVerified =
                  !!u.isKycVerified ||
                  String(kycStatus).toUpperCase() === "APPROVED";

                const isProfileVerified = !!u.isProfileVerified;

                return (
                  <TableRow
                    key={u._id}
                    className="align-top hover:bg-black/5 even:bg-black/[0.03] transition-colors"
                  >
                    <TableCell className="text-center font-medium text-slate-600">
                      {startIndex + index + 1}
                    </TableCell>

                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={u.avatar} alt={u.name} />
                        <AvatarFallback>{initials(u.name)}</AvatarFallback>
                      </Avatar>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{u.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {u.address?.city || u.address?.district || "-"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-slate-700">
                      {u.mobile || "-"}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="uppercase text-[10px]">
                        {u.role}
                      </Badge>
                    </TableCell>

                    <TableCell className="max-w-[260px]">
                      {u.BusinessType ? (
                        <div className="text-xs leading-5">
                          <span className="font-semibold">{u.BusinessType}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <ProfileProgress value={u.profilePercent ?? 0} />
                    </TableCell>

                    <TableCell>
                      <KycCell
                        status={kycStatus}
                        updatedAt={kycUpdatedAt}
                        hasDoc={hasDoc}
                        isKycVerified={isKycVerified}
                        busy={updatingKycId === u._id}
                        onToggle={(checked) =>
                          handleToggleKycVerified(u._id, u.kycId!, checked)
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <ProfileVerifiedCell
                        verified={isProfileVerified}
                        busy={updatingVerifyId === u._id}
                        onToggle={(checked) =>
                          handleToggleProfileVerified(u._id, checked)
                        }
                      />
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl"
                          onClick={() => navigate(`/admin/users/${u._id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl text-red-500 border-red-500/40 hover:bg-red-500/10"
                          onClick={() => handleDelete(u._id)}
                          disabled={deletingId === u._id}
                        >
                          {deletingId === u._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            {filtered.length > 0 ? (
              <>
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {startIndex + pageItems.length}
                </span>{" "}
                of <span className="font-medium">{filtered.length}</span> users
              </>
            ) : (
              "No results"
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-xl"
            >
              Prev
            </Button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <Button
                  key={p}
                  variant={p === currentPage ? "default" : "outline"}
                  size="sm"
                  className="px-3 rounded-xl"
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-xl"
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
