import { useEffect, useMemo, useState } from "react";
import SummaryApi, { path } from "@/constants/SummaryApi";
import Axios from "@/lib/Axios";
import { Pencil, Trash2, X, Search } from "lucide-react";
import type { AxiosError } from "axios";

type Status = "Active" | "Inactive";

type Brand = {
  _id: string;
  name: string;
  image?: string;
  status: Status;
};

type Series = {
  _id: string;
  brandId: string;
  name: string;
  slug: string;
  status: Status;
};

type ApiErrorBody = {
  message?: string;
};

type StatusFilter = "" | Status;

function getApiErrorMessage(err: unknown, fallback: string) {
  const e = err as AxiosError<ApiErrorBody>;
  return e?.response?.data?.message || fallback;
}

export default function SeriesPage() {
  // dropdown data
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);

  // list data
  const [list, setList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);

  // form state
  const [editing, setEditing] = useState<Series | null>(null);
  const [brandId, setBrandId] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("Active");
  const [saving, setSaving] = useState(false);

  // filters
  const [filterBrandId, setFilterBrandId] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

  const brandNameById = useMemo(() => {
    const map = new Map<string, string>();
    brands.forEach((b) => map.set(b._id, b.name));
    return map;
  }, [brands]);

  const resetForm = () => {
    setEditing(null);
    setBrandId("");
    setName("");
    setStatus("Active");
  };

  /* ---------------- Load Brands ---------------- */
  const fetchBrands = async () => {
    try {
      setBrandsLoading(true);
      const res = await Axios.request(SummaryApi.get_brands);
      const items: Brand[] = res?.data?.data ?? [];
      setBrands(items);
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, "Failed to load brands"));
    } finally {
      setBrandsLoading(false);
    }
  };

  /* ---------------- Load Series List ---------------- */
  const fetchSeries = async () => {
    try {
      setLoading(true);
      const res = await Axios.request({
        method: SummaryApi.get_series.method,
        url: SummaryApi.get_series.url,
        params: {
          brandId: filterBrandId || undefined,
          q: q.trim() || undefined,
          status: statusFilter || undefined,
          page: 1,
          limit: 200,
          sort: "createdAt:desc",
        },
      });
      setList(res?.data?.data ?? []);
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, "Failed to load series"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
    fetchSeries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- Add / Update ---------------- */
  const submit = async () => {
    if (!brandId) return alert("Select Brand");
    if (!name.trim()) return alert("Series name required");

    try {
      setSaving(true);

      if (editing) {
        await Axios.request({
          method: SummaryApi.update_series.method,
          url: SummaryApi.update_series.url,
          data: {
            _id: editing._id,
            name: name.trim(),
            status,
          },
        });
        alert("Series updated");
      } else {
        await Axios.request({
          method: SummaryApi.add_series.method,
          url: SummaryApi.add_series.url,
          data: {
            brandId,
            name: name.trim(),
            status,
          },
        });
        alert("Series created");
      }

      resetForm();
      fetchSeries();
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- Delete ---------------- */
  const remove = async (id: string) => {
    if (!confirm("Delete series permanently?")) return;
    try {
      await Axios.request({
        method: SummaryApi.hard_delete_series.method,
        url: path(SummaryApi.hard_delete_series.url, { id }),
      });
      fetchSeries();
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, "Delete failed"));
    }
  };

  /* ---------------- Edit ---------------- */
  const edit = (s: Series) => {
    setEditing(s);
    setBrandId(s.brandId);
    setName(s.name);
    setStatus(s.status);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* ================= ROW 1: ADD / EDIT ================= */}
        <div className="rounded-2xl border bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editing ? "Edit Series" : "Add Series"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Create series under a brand (e.g., Redmi Note, Galaxy S).
              </p>
            </div>

            {editing ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
                Cancel Edit
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Brand</label>
              <select
                className="mt-1 w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-70"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                disabled={brandsLoading}
              >
                <option value="">
                  {brandsLoading ? "Loading..." : "Select Brand"}
                </option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-gray-500">
                Brand is required for adding series.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">
                Series Name
              </label>
              <input
                className="mt-1 w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
                placeholder="e.g. Redmi Note"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Status</label>
              <select
                className="mt-1 w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="mt-4 w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : editing ? "Update Series" : "Add Series"}
              </button>
            </div>
          </div>
        </div>

        {/* ================= ROW 2: SERIES LIST ================= */}
        <div className="rounded-2xl border bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Series List</h2>
              <p className="mt-1 text-sm text-gray-500">
                Filter by brand, edit, or delete series.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                value={filterBrandId}
                onChange={(e) => setFilterBrandId(e.target.value)}
              >
                <option value="">All Brands</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-60 rounded-xl border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="Search series..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchSeries()}
                />
              </div>

              <select
                className="rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <button
                type="button"
                onClick={fetchSeries}
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white">
                  <tr className="border-b">
                    <th className="px-4 py-3">Brand</th>
                    <th className="px-4 py-3">Series</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3 w-[140px]">Status</th>
                    <th className="px-4 py-3 w-[220px] text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : list.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        No series found
                      </td>
                    </tr>
                  ) : (
                    list.map((s) => (
                      <tr key={s._id} className="border-b last:border-b-0">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {brandNameById.get(s.brandId) || "—"}
                        </td>

                        <td className="px-4 py-3 font-medium text-gray-900">
                          {s.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{s.slug}</td>

                        <td className="px-4 py-3">
                          <span
                            className={[
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                              s.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700",
                            ].join(" ")}
                          >
                            {s.status}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => edit(s)}
                              className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>

                            <button
                              onClick={() => remove(s._id)}
                              className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
