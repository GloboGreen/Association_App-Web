import { useEffect, useMemo, useRef, useState } from "react";
import SummaryApi, { path } from "@/constants/SummaryApi";
import Axios from "@/lib/Axios";
import { Pencil, Trash2, X, Image as ImageIcon, Search } from "lucide-react";

type Status = "Active" | "Inactive";

type Brand = {
  _id: string;
  name: string;
  status: Status;
  image?: string;
  slug: string;
};

const MAX_MB = 2;
const MAX_BYTES = MAX_MB * 1024 * 1024;

function validateImage(file: File) {
  const okType = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/svg+xml",
  ].includes(file.type);
  const okSize = file.size <= MAX_BYTES;
  return { okType, okSize };
}

/* ✅ ADDED: no-any safe error message helper */
function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object") {
    const e = err as { response?: { data?: { message?: string } } };
    return e.response?.data?.message ?? fallback;
  }
  return fallback;
}

export default function BrandPage() {
  const [list, setList] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);

  // form state
  const [editing, setEditing] = useState<Brand | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("Active");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // list filter
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | Status>("");

  const inputRef = useRef<HTMLInputElement>(null);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  const pickFile = () => inputRef.current?.click();

  const setPickedFile = (f: File | null) => {
    if (!f) return;

    const v = validateImage(f);
    if (!v.okType) return alert("Only PNG, JPG, WEBP, SVG allowed.");
    if (!v.okSize) return alert(`Max ${MAX_MB}MB.`);

    setFile(f);
  };

  /* ---------------- FETCH LIST ---------------- */
  const fetchBrands = async () => {
    try {
      setLoading(true);
      const res = await Axios.request({
        ...SummaryApi.get_brands,
        params: {
          q: q.trim() || undefined,
          status: statusFilter || undefined,
          page: 1,
          limit: 100,
          sort: "createdAt:desc",
        },
      });
      setList(res?.data?.data ?? []);
    } catch (e: unknown) {
      alert(getErrorMessage(e, "Failed to load brands"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- RESET FORM ---------------- */
  const resetForm = () => {
    setEditing(null);
    setName("");
    setStatus("Active");
    setFile(null);
    setDragOver(false);
  };

  /* ---------------- SUBMIT (ADD / EDIT) ---------------- */
  const submit = async () => {
    if (!name.trim()) return alert("Brand name required");

    const form = new FormData();
    form.append("name", name.trim());
    form.append("status", status);
    if (file) form.append("image", file);

    try {
      setSaving(true);

      if (editing) {
        form.append("_id", editing._id);
        await Axios.request({
          method: SummaryApi.update_brand.method,
          url: SummaryApi.update_brand.url,
          data: form,
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Brand updated");
      } else {
        await Axios.request({
          method: SummaryApi.add_brand.method,
          url: SummaryApi.add_brand.url,
          data: form,
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Brand created");
      }

      resetForm();
      fetchBrands();
    } catch (e: unknown) {
      alert(getErrorMessage(e, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- DELETE ---------------- */
  const remove = async (id: string) => {
    if (!confirm("Delete brand permanently?")) return;
    try {
      await Axios.request({
        method: SummaryApi.hard_delete_brand.method,
        url: path(SummaryApi.hard_delete_brand.url, { id }),
      });
      fetchBrands();
    } catch (e: unknown) {
      alert(getErrorMessage(e, "Delete failed"));
    }
  };

  /* ---------------- LOAD FOR EDIT ---------------- */
  const edit = (b: Brand) => {
    setEditing(b);
    setName(b.name);
    setStatus(b.status);
    setFile(null);
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
                {editing ? "Edit Brand" : "Add Brand"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {editing
                  ? "Update brand name, status, and logo."
                  : "Create a new brand with logo and status."}
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

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Left: fields */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700">Brand Name</label>
                <input
                  className="mt-1 w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="e.g. Apple"
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
                {saving ? "Saving..." : editing ? "Update Brand" : "Add Brand"}
              </button>
            </div>

            {/* Right: upload box (Association style) */}
            <div className="rounded-2xl border bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900">Brand Logo</h3>

              <div
                className={[
                  "mt-4 rounded-2xl border border-dashed p-6 transition",
                  dragOver ? "border-violet-400 bg-violet-50/60" : "border-gray-200 bg-gray-50/60",
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
                  const f = e.dataTransfer.files?.[0] ?? null;
                  setPickedFile(f);
                }}
              >
                {!file ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm">
                      <ImageIcon className="h-6 w-6" />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-gray-800">
                      Drag & drop logo here
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, SVG, up to {MAX_MB}MB.
                    </p>

                    <button
                      type="button"
                      onClick={pickFile}
                      className="mt-4 rounded-xl border bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50"
                    >
                      Choose file
                    </button>

                    <input
                      ref={inputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setPickedFile(e.target.files?.[0] ?? null)}
                    />

                    {/* show current image when editing and no new file */}
                    {!preview && editing?.image ? (
                      <div className="mt-4 flex items-center gap-3">
                        <img
                          src={editing.image}
                          alt="current"
                          className="h-14 w-14 rounded-xl border bg-white object-contain"
                        />
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-900">Current logo</p>
                          <p className="text-xs text-gray-500">No new file selected</p>
                        </div>
                      </div>
                    ) : null}
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
                        <p className="text-sm font-semibold text-gray-900">Selected logo</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {file.name} • {(file.size / 1024).toFixed(0)} KB
                        </p>
                        <button
                          type="button"
                          onClick={pickFile}
                          className="mt-2 text-xs font-medium text-violet-600 hover:underline"
                        >
                          Change file
                        </button>
                        <input
                          ref={inputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setPickedFile(e.target.files?.[0] ?? null)}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-white text-gray-700 hover:bg-gray-50"
                      title="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs text-gray-500">
                This logo will be shown in admin panel and user app wherever this brand appears.
              </p>
            </div>
          </div>
        </div>

        {/* ================= ROW 2: BRAND LIST ================= */}
        <div className="rounded-2xl border bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Brand List</h2>
              <p className="mt-1 text-sm text-gray-500">Edit or delete existing brands.</p>
            </div>

            {/* filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-64 rounded-xl border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                  placeholder="Search brand..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchBrands()}
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
                onClick={fetchBrands}
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
                    <th className="px-4 py-3 w-[150px]">Logo</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3 w-[140px]">Status</th>
                    <th className="px-4 py-3 w-[220px] text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : list.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                        No brands found
                      </td>
                    </tr>
                  ) : (
                    list.map((b) => (
                      <tr key={b._id} className="border-b last:border-b-0">
                        <td className="px-4 py-3">
                          {b.image ? (
                            <img
                              src={b.image}
                              alt={b.name}
                              className="h-[50px] w-[100px] rounded-xl border bg-white object-contain"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded-xl border bg-gray-50" />
                          )}
                        </td>

                        <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>

                        <td className="px-4 py-3">
                          <span
                            className={[
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                              b.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700",
                            ].join(" ")}
                          >
                            {b.status}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => edit(b)}
                              className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>

                            <button
                              onClick={() => remove(b._id)}
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
