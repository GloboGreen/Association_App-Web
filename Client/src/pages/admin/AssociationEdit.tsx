// src/pages/admin/AssociationEdit.tsx
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import Axios from "@/lib/Axios";
import SummaryApi from "@/constants/SummaryApi";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Loader2, ImageIcon, ArrowLeft, Save } from "lucide-react";

/* ---------------- TYPES ---------------- */

type AddressState = {
  street: string;
  area: string; // locality / landmark
  city: string; // taluk / main area
  state: string; // e.g. "Tamil Nadu"
  pincode: string;
};

type AssociationDetail = {
  _id: string;
  name: string;
  logo?: string;
  district: string;
  area: string; // you store taluk/city here (root area)
  address?: Partial<AddressState>;
  isActive: boolean;
};

type ApiListResponse = {
  success: boolean;
  data?: string[];
  states?: string[];
  districts?: string[];
  taluks?: string[];
  message?: string;
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

function cleanList(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter((x) => x.length > 0);
}

const GRAD = "from-blue-600 via-purple-600 to-pink-500";

/* ---------------- PAGE ---------------- */

export default function AssociationEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pageLoading, setPageLoading] = useState(true);

  // form states
  const [name, setName] = useState("");
  const [district, setDistrict] = useState<string>(""); // API district
  const [area, setArea] = useState<string>(""); // root area (taluk/city)

  const [address, setAddress] = useState<AddressState>({
    street: "",
    area: "",
    city: "",
    state: "Tamil Nadu",
    pincode: "",
  });

  const [isActive, setIsActive] = useState(true);

  // logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // dropdown data
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [taluks, setTaluks] = useState<string[]>([]);

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingTaluks, setLoadingTaluks] = useState(false);

  // submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddressChange = (field: keyof AddressState, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  /* ---------------- API: Dropdowns ---------------- */

  const fetchStates = async (): Promise<void> => {
    try {
      setLoadingStates(true);
      const res = await Axios.get<ApiListResponse>(SummaryApi.locations_states.url);
      const list = cleanList(res.data?.states ?? res.data?.data);
      setStates(list.length ? list : ["Tamil Nadu"]);
    } catch {
      // safe fallback
      setStates(["Tamil Nadu"]);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchDistricts = async (stateName: string): Promise<void> => {
    try {
      setLoadingDistricts(true);
      const url = `${SummaryApi.locations_districts.url}?state=${encodeURIComponent(stateName)}`;
      const res = await Axios.get<ApiListResponse>(url);
      setDistricts(cleanList(res.data?.districts ?? res.data?.data));
    } catch (err: unknown) {
      setDistricts([]);
      setErrorMsg(getAxiosMessage(err));
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchTaluks = async (stateName: string, districtName: string): Promise<void> => {
    try {
      setLoadingTaluks(true);
      const url =
        `${SummaryApi.locations_taluks.url}?state=${encodeURIComponent(stateName)}` +
        `&district=${encodeURIComponent(districtName)}`;
      const res = await Axios.get<ApiListResponse>(url);
      setTaluks(cleanList(res.data?.taluks ?? res.data?.data));
    } catch (err: unknown) {
      setTaluks([]);
      setErrorMsg(getAxiosMessage(err));
    } finally {
      setLoadingTaluks(false);
    }
  };

  /* ---------------- fetch existing association ---------------- */

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async (): Promise<void> => {
      try {
        setPageLoading(true);
        setErrorMsg(null);

        // load dropdown state list first (safe)
        await fetchStates();

        // association detail
        const res = await Axios.get(SummaryApi.association_detail.url.replace(":id", id));
        const data: AssociationDetail = res.data?.data;

        const stateFromApi = data?.address?.state ?? "Tamil Nadu";

        setName(data?.name ?? "");
        setDistrict(data?.district ?? "");
        setArea(data?.area ?? "");

        setAddress({
          street: data?.address?.street ?? "",
          area: data?.address?.area ?? "",
          city: data?.address?.city ?? "",
          state: stateFromApi,
          pincode: data?.address?.pincode ?? "",
        });

        setIsActive(Boolean(data?.isActive));
        setLogoPreview(data?.logo ?? null);

        // districts and taluks for current selection
        await fetchDistricts(stateFromApi);
        if (data?.district) {
          await fetchTaluks(stateFromApi, data.district);
        }
      } catch (err: unknown) {
        setErrorMsg(getAxiosMessage(err));
      } finally {
        setPageLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  /* ---------------- derived options (no empty values) ---------------- */

  const stateOptions = useMemo(() => cleanList(states), [states]);
  const districtOptions = useMemo(() => cleanList(districts), [districts]);
  const talukOptions = useMemo(() => cleanList(taluks), [taluks]);

  /* ---------------- handlers ---------------- */

  const onStateChange = async (value: string) => {
    // value must NOT be "" because Radix SelectItem disallows ""
    handleAddressChange("state", value);

    // reset dependent fields
    setDistrict("");
    setArea("");
    handleAddressChange("city", "");

    setDistricts([]);
    setTaluks([]);

    await fetchDistricts(value);
  };

  const onDistrictChange = async (value: string) => {
    setDistrict(value);

    // reset taluk/city when district changes
    setArea("");
    handleAddressChange("city", "");

    setTaluks([]);

    await fetchTaluks(address.state, value);
  };

  const onTalukChange = (value: string) => {
    handleAddressChange("city", value);
    setArea(value); // backend expects root `area` = taluk/city
  };

  /* ---------------- logo handlers ---------------- */

  const handleLogoSelect = (file: File | null) => {
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleLogoSelect(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] || null;
    if (file) handleLogoSelect(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  /* ---------------- submit ---------------- */

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!id) {
      setErrorMsg("Missing association id.");
      return;
    }

    if (!name.trim() || !address.state || !district || !address.city) {
      setErrorMsg("Name, state, district and city/taluk are required.");
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("district", district);
      formData.append("area", area || address.city);

      formData.append("address[street]", address.street);
      formData.append("address[area]", address.area);
      formData.append("address[city]", address.city);
      formData.append("address[state]", address.state);
      formData.append("address[pincode]", address.pincode);

      formData.append("isActive", String(isActive));
      if (logoFile) formData.append("logo", logoFile);

      await Axios.patch(SummaryApi.association_update.url.replace(":id", id), formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/admin/association/list");
    } catch (err: unknown) {
      setErrorMsg(getAxiosMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- UI ---------------- */

  if (pageLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl bg-white/40 hover:bg-white/60 text-slate-900"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Edit Association</h1>
            <p className="text-sm text-slate-600">Loading association details…</p>
          </div>
        </div>

        <Card className="rounded-2xl border border-white/40 bg-white/55 backdrop-blur-xl shadow-sm">
          <CardContent className="flex items-center gap-2 py-8 text-sm text-slate-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Fetching data…
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl bg-white/40 hover:bg-white/60 text-slate-900"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Edit Association
            </h1>
            <p className="text-sm text-slate-600">
              Update logo, location, address and status.
            </p>
          </div>
        </div>

        <Badge
          className={
            isActive
              ? `bg-gradient-to-r ${GRAD} text-white`
              : "bg-white/60 text-slate-800 border border-white/60"
          }
        >
          {isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          {/* Left */}
          <Card className="rounded-2xl border border-white/40 bg-white/55 backdrop-blur-xl shadow-sm">
            <CardHeader className="border-b border-white/40">
              <CardTitle className="text-base text-slate-900">
                Association Details
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 pt-6">
              {/* Name */}
              <div className="space-y-2">
                <Label className="text-slate-800" htmlFor="name">
                  Association Name
                </Label>
                <Input
                  id="name"
                  className="rounded-xl border-white/60 bg-white/70 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-purple-400"
                  placeholder="TN Bike Dealers Association"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-slate-800" htmlFor="status">
                  Status
                </Label>
                <Select
                  value={isActive ? "active" : "inactive"}
                  onValueChange={(v) => setIsActive(v === "active")}
                >
                  <SelectTrigger
                    id="status"
                    className="rounded-xl border-white/60 bg-white/70 text-slate-900 focus:ring-2 focus:ring-purple-400"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-white/60 bg-white/95 text-slate-900 backdrop-blur-xl">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* State + District */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* State */}
                <div className="space-y-2">
                  <Label className="text-slate-800" htmlFor="state-select">
                    State
                  </Label>
                  <Select value={address.state} onValueChange={onStateChange}>
                    <SelectTrigger
                      id="state-select"
                      className="rounded-xl border-white/60 bg-white/70 text-slate-900 focus:ring-2 focus:ring-purple-400"
                    >
                      <SelectValue placeholder={loadingStates ? "Loading…" : "Select state"} />
                    </SelectTrigger>

                    <SelectContent className="border border-white/60 bg-white/95 text-slate-900 backdrop-blur-xl">
                      {stateOptions.map((st) => (
                        <SelectItem key={st} value={st}>
                          {st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* District */}
                <div className="space-y-2">
                  <Label className="text-slate-800" htmlFor="district-select">
                    District
                  </Label>
                  <Select
                    value={district}
                    onValueChange={onDistrictChange}
                    disabled={!address.state || loadingDistricts}
                  >
                    <SelectTrigger
                      id="district-select"
                      className="rounded-xl border-white/60 bg-white/70 text-slate-900 focus:ring-2 focus:ring-purple-400 disabled:opacity-60"
                    >
                      <SelectValue
                        placeholder={
                          loadingDistricts
                            ? "Loading districts…"
                            : address.state
                            ? "Select district"
                            : "Select state first"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent className="border border-white/60 bg-white/95 text-slate-900 backdrop-blur-xl">
                      {districtOptions.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* City/Taluk + Locality */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Taluk */}
                <div className="space-y-2">
                  <Label className="text-slate-800" htmlFor="taluk-select">
                    City / Taluk
                  </Label>
                  <Select
                    value={address.city}
                    onValueChange={onTalukChange}
                    disabled={!district || loadingTaluks}
                  >
                    <SelectTrigger
                      id="taluk-select"
                      className="rounded-xl border-white/60 bg-white/70 text-slate-900 focus:ring-2 focus:ring-purple-400 disabled:opacity-60"
                    >
                      <SelectValue
                        placeholder={
                          loadingTaluks
                            ? "Loading taluks…"
                            : district
                            ? "Select city / taluk"
                            : "Select district first"
                        }
                      />
                    </SelectTrigger>

                    <SelectContent className="border border-white/60 bg-white/95 text-slate-900 backdrop-blur-xl">
                      {talukOptions.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Locality */}
                <div className="space-y-2">
                  <Label className="text-slate-800" htmlFor="locality">
                    Locality / Exact Area
                  </Label>
                  <Input
                    id="locality"
                    className="rounded-xl border-white/60 bg-white/70 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-purple-400"
                    placeholder="Street / block / landmark"
                    value={address.area}
                    onChange={(e) => handleAddressChange("area", e.target.value)}
                  />
                </div>
              </div>

              {/* Street */}
              <div className="space-y-2">
                <Label className="text-slate-800" htmlFor="street">
                  Street / Address line
                </Label>
                <Textarea
                  id="street"
                  rows={3}
                  className="rounded-xl border-white/60 bg-white/70 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-purple-400"
                  placeholder="No. 10, XYZ Street, near ABC signal"
                  value={address.street}
                  onChange={(e) => handleAddressChange("street", e.target.value)}
                />
              </div>

              {/* Pincode */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-800" htmlFor="pincode">
                    Pincode
                  </Label>
                  <Input
                    id="pincode"
                    className="rounded-xl border-white/60 bg-white/70 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-purple-400"
                    value={address.pincode}
                    onChange={(e) => handleAddressChange("pincode", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Logo */}
          <Card className="rounded-2xl border border-white/40 bg-white/55 backdrop-blur-xl shadow-sm">
            <CardHeader className="border-b border-white/40">
              <CardTitle className="text-base text-slate-900">Association Logo</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 pt-6">
              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-slate-700 transition hover:bg-white/75"
                onDrop={onDrop}
                onDragOver={onDragOver}
                onClick={() =>
                  (document.getElementById("logo-edit") as HTMLInputElement | null)?.click()
                }
                role="button"
                tabIndex={0}
              >
                {logoPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-h-32 w-auto rounded-xl bg-white/70 p-2"
                    />
                    <p className="text-xs text-slate-600">Click / drag & drop to replace</p>
                  </div>
                ) : (
                  <>
                    <div className={`rounded-2xl bg-gradient-to-r ${GRAD} p-[1px]`}>
                      <div className="rounded-2xl bg-white p-3">
                        <ImageIcon className="h-8 w-8 text-slate-900" />
                      </div>
                    </div>
                    <p className="mt-3 text-sm font-semibold">Drag & drop logo here</p>
                    <p className="mt-1 text-xs text-slate-600">PNG, JPG, SVG up to 2MB.</p>
                  </>
                )}

                <input
                  id="logo-edit"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileInputChange}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-xl border-white/60 bg-white/70 hover:bg-white/90 text-slate-900"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    (document.getElementById("logo-edit") as HTMLInputElement | null)?.click();
                  }}
                >
                  Choose file
                </Button>
              </div>

              <p className="text-xs text-slate-600">
                This logo will appear in admin panel and user app wherever the association is shown.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="submit"
            disabled={isSubmitting}
            className={`rounded-xl bg-gradient-to-r ${GRAD} text-white hover:opacity-95`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Association
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="rounded-xl bg-white/40 hover:bg-white/60 text-slate-900"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
