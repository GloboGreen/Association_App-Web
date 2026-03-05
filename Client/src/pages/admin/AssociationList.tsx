// src/pages/admin/AssociationList.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Axios from "@/lib/Axios";
import SummaryApi from "@/constants/SummaryApi";

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

import {
  Loader2,
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
  RefreshCcw,
} from "lucide-react";

/* ---------------- TYPES ---------------- */

type Address = {
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

type Association = {
  _id: string;
  name: string;
  logo?: string;
  district: string;
  area: string;
  address?: Address;
  isActive: boolean;
  createdAt: string;
};

/* ---------------- HELPERS ---------------- */

function getAxiosMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message ?? err.message ?? "Request failed";
  }
  if (err instanceof Error) return err.message;
  return "Unexpected error occurred";
}

function initials(name: string): string {
  return (name || "A")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

const ITEMS_PER_PAGE = 10;
const GRAD = "from-blue-600 via-purple-600 to-pink-500";

/* ---------------- PAGE ---------------- */

export default function AssociationList() {
  const [items, setItems] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchAssociations = async (): Promise<void> => {
    try {
      setErrorMsg(null);
      setRefreshing(true);
      const res = await Axios.get(SummaryApi.association_list.url);
      setItems(res.data?.data || []);
    } catch (err: unknown) {
      console.error("Failed to load associations", err);
      setErrorMsg(getAxiosMessage(err));
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssociations();
  }, []);

  /* -------- filter by search -------- */

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter((a) => {
      const city = a.address?.city || "";
      const pincode = a.address?.pincode || "";
      const text = `${a.name} ${a.district} ${a.area} ${city} ${pincode}`.toLowerCase();
      return text.includes(term);
    });
  }, [items, search]);

  /* -------- paging -------- */

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  /* -------- delete -------- */

  const handleDelete = async (id: string) => {
    const ok = window.confirm(
      "Are you sure you want to delete this association? This action cannot be undone."
    );
    if (!ok) return;

    try {
      setDeletingId(id);
      await Axios.delete(SummaryApi.association_delete.url.replace(":id", id));
      setItems((prev) => prev.filter((a) => a._id !== id));
    } catch (err: unknown) {
      console.error("Failed to delete association", err);
      alert(getAxiosMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  /* ---------------- UI ---------------- */

  if (loading) {
    return (
      <Card className="rounded-2xl border border-white/40 bg-white/55 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Associations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="flex items-center gap-2 text-sm text-slate-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-white/40 bg-white/55 backdrop-blur-xl shadow-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <CardTitle className="text-xl font-semibold text-slate-900">
            Associations
          </CardTitle>
          <p className="mt-1 text-sm text-slate-600">
            Manage associations, locations and status.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-[340px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search by name, district, area, city, pincode…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border-white/60 bg-white/70 pl-9 pr-9 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-purple-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-600 hover:bg-white/70"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Refresh */}
          <Button
            type="button"
            variant="outline"
            onClick={fetchAssociations}
            className="h-10 rounded-xl border-white/60 bg-white/70 text-slate-900 hover:bg-white/90"
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>

          {/* Create */}
          <Button
            type="button"
            onClick={() => navigate("/admin/association/create")}
            className={`h-10 rounded-xl bg-gradient-to-r ${GRAD} text-white hover:opacity-95`}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMsg}
          </div>
        )}

        {/* Table wrapper for mobile horizontal scroll */}
        <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/45">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/40">
                  <TableHead className="w-[72px] text-slate-700">Logo</TableHead>
                  <TableHead className="min-w-[220px] text-slate-700">Name</TableHead>
                  <TableHead className="min-w-[160px] text-slate-700">District</TableHead>
                  <TableHead className="min-w-[160px] text-slate-700">Area</TableHead>
                  <TableHead className="min-w-[160px] text-slate-700">City</TableHead>
                  <TableHead className="min-w-[120px] text-slate-700">Pincode</TableHead>
                  <TableHead className="min-w-[120px] text-slate-700">Status</TableHead>
                  <TableHead className="w-[160px] text-right text-slate-700">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pageItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center">
                      <span className="text-sm text-slate-600">
                        No associations found.
                      </span>
                    </TableCell>
                  </TableRow>
                )}

                {pageItems.map((a) => (
                  <TableRow
                    key={a._id}
                    className="hover:bg-white/55 transition-colors"
                  >
                    <TableCell>
                      <Avatar className="h-9 w-9 ring-2 ring-white/60">
                        <AvatarImage src={a.logo} alt={a.name} />
                        <AvatarFallback className={`bg-gradient-to-r ${GRAD} text-white`}>
                          {initials(a.name)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>

                    <TableCell className="font-semibold text-slate-900">
                      {a.name}
                    </TableCell>

                    <TableCell className="text-slate-800">{a.district}</TableCell>
                    <TableCell className="text-slate-800">{a.area}</TableCell>

                    <TableCell className="text-slate-800">
                      {a.address?.city || "-"}
                    </TableCell>

                    <TableCell className="text-slate-800">
                      {a.address?.pincode || "-"}
                    </TableCell>

                    <TableCell>
                      {a.isActive ? (
                        <Badge className={`bg-gradient-to-r ${GRAD} text-white`}>
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-white/70 text-slate-800 border border-white/60">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-xl border-white/60 bg-white/70 hover:bg-white/90 text-slate-900"
                          onClick={() => navigate(`/admin/association/${a._id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-xl border-rose-300/60 bg-white/70 text-rose-600 hover:bg-rose-50"
                          onClick={() => handleDelete(a._id)}
                          disabled={deletingId === a._id}
                        >
                          {deletingId === a._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {filtered.length > 0 ? (
              <>
                Showing <span className="font-semibold">{startIndex + 1}</span> to{" "}
                <span className="font-semibold">{startIndex + pageItems.length}</span> of{" "}
                <span className="font-semibold">{filtered.length}</span>
              </>
            ) : (
              "No results"
            )}
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-white/60 bg-white/70 hover:bg-white/90 text-slate-900"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </Button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              const active = p === currentPage;

              return (
                <Button
                  key={p}
                  type="button"
                  size="sm"
                  onClick={() => handlePageChange(p)}
                  className={
                    active
                      ? `rounded-xl bg-gradient-to-r ${GRAD} text-white hover:opacity-95`
                      : "rounded-xl border border-white/60 bg-white/70 text-slate-900 hover:bg-white/90"
                  }
                  variant={active ? "default" : "outline"}
                >
                  {p}
                </Button>
              );
            })}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-white/60 bg-white/70 hover:bg-white/90 text-slate-900"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
