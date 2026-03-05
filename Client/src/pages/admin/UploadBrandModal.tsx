import React, { useRef, useState, useCallback } from "react";
import { IoClose } from "react-icons/io5";
import { toast } from "sonner";
import uploadImage from "../../utils/UploadImage";
import Axios from "../../lib/Axios";
import SummaryApi from "@/constants/SummaryApi";

type Props = { close: () => void; fetchData: () => void; };
type FormState = { name: string; image: string; status: "Active" | "Inactive"; };

const MAX_MB = 5;

const UploadBrandModal: React.FC<Props> = ({ close, fetchData }) => {
  const [form, setForm] = useState<FormState>({ name: "", image: "", status: "Active" });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const validateFile = (file: File) => {
    const okType = /^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.type);
    const okSize = file.size <= MAX_MB * 1024 * 1024;
    if (!okType) throw new Error("Only PNG/JPG/WEBP/GIF/SVG allowed");
    if (!okSize) throw new Error(`File must be ≤ ${MAX_MB}MB`);
  };

  const pickUrl = (payload: any): string =>
    payload?.data?.url || payload?.data?.secure_url || payload?.url || payload?.secure_url || "";

  const doUpload = async (file: File) => {
    try {
      validateFile(file);
      setIsUploading(true);
      const resp = await uploadImage(file);
      const url = pickUrl(resp);
      if (!url) throw new Error("Upload did not return a URL");
      setField("image", url);
      toast.success("Logo uploaded");
    } catch (e: any) {
      setField("image", "");
      toast.error(e?.message || "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void doUpload(f);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) void doUpload(f);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isUploading) return;
    const name = form.name.trim();
    if (!name) return toast.info("Please enter a brand name");
    if (!form.image) return toast.info("Please upload a logo");

    try {
      setIsSubmitting(true);
      const { data: resp } = await Axios({
        ...SummaryApi.add_brand,
        data: { name, image: form.image, status: form.status },
      });
      if (resp?.success) {
        toast.success(resp?.message || "Brand added");
        fetchData(); close();
      } else toast.error(resp?.message || "Failed to add brand");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Error");
    } finally { setIsSubmitting(false); }
  };

  const canSubmit = !!form.name.trim() && !!form.image && !isSubmitting && !isUploading;

  return (
    <section className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" aria-modal role="dialog">
      <div className="w-full max-w-lg p-4 bg-white rounded-2xl">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold">Add Brand</h1>
          <button onClick={close} aria-label="Close"><IoClose size={24}/></button>
        </div>

        <form className="grid gap-6 p-4" onSubmit={submit}>
          <label className="grid gap-1">
            <span className="font-medium">Brand Name</span>
            <input
              className="px-3 py-2 border rounded"
              value={form.name}
              onChange={(e)=>setField("name", e.target.value)}
              placeholder="Enter brand name"
            />
          </label>

          <div className="grid gap-2">
            <p className="font-medium">Brand Logo</p>
            <label
              htmlFor="uploadBrandLogo"
              onDragOver={(e)=>e.preventDefault()}
              onDrop={onDrop}
              className={`group relative flex h-44 items-center justify-center rounded-lg border-2 border-dashed overflow-hidden transition
                ${!isUploading && !isSubmitting ? "bg-white border-gray-300 hover:bg-gray-50" : "bg-gray-100 border-gray-200 cursor-not-allowed"}`}
              aria-busy={isUploading}
            >
              {!form.image ? (
                <div className="text-center pointer-events-none">
                  <p className="text-lg font-medium text-gray-600 group-hover:text-gray-800">Upload Logo</p>
                  <p className="mt-1 text-xs text-gray-400">Click or drag & drop (PNG/JPG up to {MAX_MB}MB)</p>
                </div>
              ) : (
                <>
                  <img src={form.image} alt="Logo" className="absolute inset-0 object-contain w-full h-full" />
                  <div className="absolute inset-0 transition bg-black/0 group-hover:bg-black/10" />
                  <div className="absolute flex gap-2 bottom-2 right-2">
                    <button type="button" onClick={()=>fileInputRef.current?.click()} className="px-2 py-1 text-xs font-semibold rounded shadow bg-white/90">
                      Replace
                    </button>
                    <button type="button" onClick={()=>setField("image","")} className="px-2 py-1 text-xs font-semibold rounded shadow bg-white/90">
                      Remove
                    </button>
                  </div>
                </>
              )}
              <input ref={fileInputRef} id="uploadBrandLogo" type="file" className="hidden" accept="image/*" onChange={onFile} disabled={isUploading || isSubmitting}/>
            </label>
          </div>

          <label className="grid gap-1">
            <span className="font-medium">Status</span>
            <select className="px-3 py-2 border rounded" value={form.status} onChange={(e)=>setField("status", e.target.value as any)}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </label>

          <button type="submit" disabled={!canSubmit} className={`rounded px-4 py-2 font-semibold text-white ${canSubmit ? "bg-green-600 hover:bg-green-700" : "bg-gray-300"}`}>
            {isSubmitting ? "Adding…" : "Add brand"}
          </button>
        </form>
      </div>
    </section>
  );
};
export default UploadBrandModal;
