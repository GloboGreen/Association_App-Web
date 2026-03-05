import { useEffect, useMemo, useRef, useState } from "react";
import Axios from "@/lib/Axios";
import SummaryApi, { path } from "@/constants/SummaryApi";
import {
  Image as ImageIcon,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";

/* ===================== Types ===================== */
type Status = "Active" | "Inactive";

type Brand = {
  _id: string;
  name: string;
};

type Series = {
  _id: string;
  brandId: string;
  name: string;
};

type PhoneModel = {
  _id: string;
  brandId: string;
  seriesId: string;
  name: string;
  imageUrl?: string;
  status: Status;
};

/* ===================== Error helper (NO any) ===================== */
function getErrMsg(err: unknown, fallback = "Request failed") {
  if (!err || typeof err !== "object") return fallback;

  // axios-like: err.response.data.message
  const e = err as { response?: { data?: { message?: string } } };
  return e.response?.data?.message || fallback;
}

/* ===================== Inline ImageDropzone ===================== */
type ImageDropzoneProps = {
  title?: string;
  hint?: string;
  maxMB?: number;
  accept?: string;
  valueFile: File | null;
  onChangeFile: (f: File | null) => void;
  existingUrl?: string;
};

function ImageDropzone({
  title = "Image Upload",
  hint = "This image will be shown in the admin panel and user app.",
  maxMB = 2,
  accept = "image/*",
  valueFile,
  onChangeFile,
  existingUrl = "",
}: ImageDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxBytes = maxMB * 1024 * 1024;

  const preview = useMemo(() => {
    if (valueFile) return URL.createObjectURL(valueFile);
    return "";
  }, [valueFile]);

  const pickFile = () => inputRef.current?.click();

  const validateAndSet = (f: File | null) => {
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      alert("Only image files allowed");
      return;
    }
    if (f.size > maxBytes) {
      alert(`Max ${maxMB}MB allowed`);
      return;
    }

    onChangeFile(f);
  };

  const fileLabel = valueFile
    ? `${valueFile.name} • ${(valueFile.size / 1024).toFixed(0)} KB`
    : "";

  return (
    <div className="rounded-2xl border bg-white/80 p-6 shadow-sm backdrop-blur">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>

      <div
        className={[
          "mt-4 rounded-2xl border border-dashed p-7 transition",
          dragOver
            ? "border-violet-400 bg-violet-50/60"
            : "border-gray-200 bg-gray-50/60",
        ].join(" ")}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          validateAndSet(e.dataTransfer.files?.[0] ?? null);
        }}
      >
        {!valueFile ? (
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm">
              <ImageIcon className="h-6 w-6" />
            </div>

            <p className="mt-4 text-sm font-semibold text-gray-800">
              Drag & drop logo here
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PNG, JPG, SVG, up to {maxMB}MB.
            </p>

            <button
              type="button"
              onClick={pickFile}
              className="mt-4 rounded-xl border bg-white px-5 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50"
            >
              Choose file
            </button>

            {/* existing preview (edit mode) */}
            {!preview && existingUrl ? (
              <div className="mt-5 flex items-center gap-3 rounded-xl border bg-white px-3 py-2">
                <img
                  src={existingUrl}
                  alt="existing"
                  className="h-12 w-12 rounded-lg border bg-white object-contain"
                />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    Current image
                  </p>
                  <p className="text-xs text-gray-500">
                    Select a new file to replace
                  </p>
                </div>
              </div>
            ) : null}

            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => validateAndSet(e.target.files?.[0] ?? null)}
            />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={preview}
                alt="preview"
                className="h-16 w-16 rounded-xl border bg-white object-contain"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Selected file
                </p>
                <p className="mt-1 text-xs text-gray-500">{fileLabel}</p>
                <button
                  type="button"
                  onClick={pickFile}
                  className="mt-2 text-xs font-medium text-violet-600 hover:underline"
                >
                  Change file
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onChangeFile(null)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-white text-gray-700 hover:bg-gray-50"
              title="Remove"
            >
              <X className="h-4 w-4" />
            </button>

            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => validateAndSet(e.target.files?.[0] ?? null)}
            />
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-500">{hint}</p>
    </div>
  );
}

/* ===================== Page ===================== */
export default function ModelPage() {
  /* ---------- master data ---------- */
  const [brands, setBrands] = useState<Brand[]>([]);
  const [seriesAll, setSeriesAll] = useState<Series[]>([]);
  const [seriesForm, setSeriesForm] = useState<Series[]>([]);

  /* ---------- form ---------- */
  const [editing, setEditing] = useState<PhoneModel | null>(null);
  const [brandId, setBrandId] = useState("");
  const [seriesId, setSeriesId] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("Active");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  /* ---------- list + pagination ---------- */
  const [list, setList] = useState<PhoneModel[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // ✅ default 10
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  /* ---------- filters ---------- */
  const [filterBrandId, setFilterBrandId] = useState("");
  const [filterSeriesId, setFilterSeriesId] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | Status>("");

  /* ---------- maps ---------- */
  const brandName = useMemo(
    () => new Map(brands.map((b) => [b._id, b.name])),
    [brands]
  );

  const seriesName = useMemo(
    () => new Map(seriesAll.map((s) => [s._id, s.name])),
    [seriesAll]
  );

  const filterSeriesOptions = useMemo(() => {
    if (!filterBrandId) return [];
    return seriesAll.filter((s) => s.brandId === filterBrandId);
  }, [seriesAll, filterBrandId]);

  const showingFrom = useMemo(
    () => (total === 0 ? 0 : (page - 1) * limit + 1),
    [page, limit, total]
  );

  const showingTo = useMemo(
    () => Math.min(page * limit, total),
    [page, limit, total]
  );

  /* ===================== API ===================== */
  const fetchBrands = async () => {
    const res = await Axios.request(SummaryApi.get_brands);
    setBrands(res?.data?.data ?? []);
  };

  const fetchAllSeries = async () => {
    const res = await Axios.request({
      method: SummaryApi.get_series.method,
      url: SummaryApi.get_series.url,
      params: { page: 1, limit: 5000 },
    });
    setSeriesAll(res?.data?.data ?? []);
  };

  const fetchSeriesForForm = async (bId: string) => {
    if (!bId) {
      setSeriesForm([]);
      return;
    }
    const res = await Axios.request({
      method: SummaryApi.get_series.method,
      url: SummaryApi.get_series.url,
      params: { brandId: bId, page: 1, limit: 2000 },
    });
    setSeriesForm(res?.data?.data ?? []);
  };

  const fetchModels = async () => {
    try {
      setLoading(true);
      const res = await Axios.request({
        method: SummaryApi.get_models.method,
        url: SummaryApi.get_models.url,
        params: {
          brandId: filterBrandId || undefined,
          seriesId: filterSeriesId || undefined,
          q: q.trim() || undefined,
          status: statusFilter || undefined,
          page,
          limit,
          sort: "createdAt:desc",
        },
      });

      setList(res?.data?.data ?? []);
      const pg = res?.data?.pagination;
      setTotal(pg?.total ?? 0);
      setPages(pg?.pages ?? 1);
    } catch (err: unknown) {
      alert(getErrMsg(err, "Failed to fetch models"));
    } finally {
      setLoading(false);
    }
  };

  /* ===================== Init load ===================== */
  useEffect(() => {
    (async () => {
      try {
        await fetchBrands();
        await fetchAllSeries(); // ✅ needed for list series name
        await fetchModels();
      } catch (err: unknown) {
        alert(getErrMsg(err, "Init failed"));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===================== Form brand change ===================== */
  useEffect(() => {
    fetchSeriesForForm(brandId);
    setSeriesId("");
  }, [brandId]);

  /* ===================== Filter/Limit change -> reset page ===================== */
  useEffect(() => {
    setPage(1);
  }, [filterBrandId, filterSeriesId, statusFilter, q, limit]);

  /* ===================== Fetch when page/filters change ===================== */
  useEffect(() => {
    fetchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterBrandId, filterSeriesId, statusFilter, q, limit]);

  /* ===================== Actions ===================== */
  const resetForm = () => {
    setEditing(null);
    setBrandId("");
    setSeriesId("");
    setName("");
    setStatus("Active");
    setFile(null);
    setSeriesForm([]);
  };

  const submit = async () => {
    if (!brandId) return alert("Select Brand");
    if (!seriesId) return alert("Select Series");
    if (!name.trim()) return alert("Model name required");

    const form = new FormData();
    form.append("brandId", brandId);
    form.append("seriesId", seriesId);
    form.append("name", name.trim());
    form.append("status", status);
    if (file) form.append("image", file);

    try {
      setSaving(true);

      if (editing) {
        form.append("_id", editing._id);
        await Axios.request({
          method: SummaryApi.update_model.method,
          url: SummaryApi.update_model.url,
          data: form,
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Model updated");
      } else {
        await Axios.request({
          method: SummaryApi.add_model.method,
          url: SummaryApi.add_model.url,
          data: form,
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Model created");
      }

      resetForm();
      await fetchAllSeries();
      setPage(1);
      await fetchModels();
    } catch (err: unknown) {
      alert(getErrMsg(err, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const onEdit = async (m: PhoneModel) => {
    setEditing(m);
    setName(m.name);
    setStatus(m.status);
    setFile(null);

    setBrandId(m.brandId);
    await fetchSeriesForForm(m.brandId);
    setSeriesId(m.seriesId);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete model permanently?")) return;
    try {
      await Axios.request({
        method: SummaryApi.hard_delete_model.method,
        url: path(SummaryApi.hard_delete_model.url, { id }),
      });
      await fetchModels();
    } catch (err: unknown) {
      alert(getErrMsg(err, "Delete failed"));
    }
  };

  /* ===================== UI ===================== */
  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* ROW 1: Add/Edit + Upload */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="rounded-2xl border bg-white/80 p-6 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editing ? "Edit Model" : "Add Model"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Select Brand → Series, then add model with image.
                </p>
              </div>

              {editing ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              ) : null}
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700">Brand</label>
                <select
                  className="mt-1 w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                >
                  <option value="">Select Brand</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Series</label>
                <select
                  className="mt-1 w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-60"
                  value={seriesId}
                  onChange={(e) => setSeriesId(e.target.value)}
                  disabled={!brandId}
                >
                  <option value="">
                    {brandId ? "Select Series" : "Select Brand first"}
                  </option>
                  {seriesForm.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Model Name</label>
                <input
                  className="mt-1 w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="e.g. iPhone 14 Pro"
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
              </div>

              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : editing ? "Update Model" : "Add Model"}
              </button>
            </div>
          </div>

          {/* Upload */}
          <ImageDropzone
            title="Model Image"
            hint="This image will be shown to users when selecting a model."
            maxMB={2}
            valueFile={file}
            onChangeFile={setFile}
            existingUrl={editing?.imageUrl || ""}
          />
        </div>

        {/* ROW 2: List */}
        <div className="rounded-2xl border bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Model List</h2>
              <p className="mt-1 text-sm text-gray-500">
                Filter by brand/series and manage models.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                value={filterBrandId}
                onChange={(e) => {
                  setFilterBrandId(e.target.value);
                  setFilterSeriesId("");
                }}
              >
                <option value="">All Brands</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <select
                className="rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-60"
                value={filterSeriesId}
                onChange={(e) => setFilterSeriesId(e.target.value)}
                disabled={!filterBrandId}
              >
                <option value="">
                  {filterBrandId ? "All Series" : "Select Brand first"}
                </option>
                {filterSeriesOptions.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-56 rounded-xl border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="Search model..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <select
                className="rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "" | Status)}
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  fetchModels();
                }}
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
                    <th className="px-4 py-3 w-[90px]">Image</th>
                    <th className="px-4 py-3">Brand</th>
                    <th className="px-4 py-3">Series</th>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3 w-[140px]">Status</th>
                    <th className="px-4 py-3 w-[220px] text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : list.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        No models found
                      </td>
                    </tr>
                  ) : (
                    list.map((m) => (
                      <tr key={m._id} className="border-b last:border-b-0">
                        <td className="px-4 py-3">
                          {m.imageUrl ? (
                            <img
                              src={m.imageUrl}
                              alt={m.name}
                              className="h-10 w-10 rounded-xl border bg-white object-contain"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-xl border bg-gray-50" />
                          )}
                        </td>

                        <td className="px-4 py-3 font-medium text-gray-900">
                          {brandName.get(m.brandId) || "—"}
                        </td>

                        <td className="px-4 py-3 text-gray-700">
                          {seriesName.get(m.seriesId) || "—"}
                        </td>

                        <td className="px-4 py-3 font-medium text-gray-900">
                          {m.name}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={[
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                              m.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700",
                            ].join(" ")}
                          >
                            {m.status}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => onEdit(m)}
                              className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>

                            <button
                              onClick={() => onDelete(m._id)}
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

          {/* Pagination */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{showingFrom}</span> to{" "}
              <span className="font-medium">{showingTo}</span> of{" "}
              <span className="font-medium">{total}</span>
            </div>

            <div className="flex items-center gap-3">
              <select
                className="rounded-xl border bg-white px-3 py-2 text-sm"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>

              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
              >
                Prev
              </button>

              <span className="text-sm font-medium">
                Page {page} of {pages}
              </span>

              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
