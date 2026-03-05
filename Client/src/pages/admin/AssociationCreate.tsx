import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import Axios from "@/lib/Axios";
import SummaryApi, { baseURL } from "@/constants/SummaryApi";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Loader2, ImageIcon, PlusCircle } from "lucide-react";

/* ---------------- TYPES ---------------- */

type AddressState = {
  street: string;
  area: string; // locality / landmark
  city: string; // taluk / city
  state: string;
  pincode: string;
};

type ApiListResponse = string[] | { success?: boolean; data?: string[]; states?: string[]; districts?: string[]; taluks?: string[] };

function pickStringList(payload: unknown): string[] {
  if (Array.isArray(payload)) return payload.filter((x): x is string => typeof x === "string");
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    const candidates = [
      p.data,
      p.states,
      p.districts,
      p.taluks,
    ];
    for (const c of candidates) {
      if (Array.isArray(c)) return c.filter((x): x is string => typeof x === "string");
    }
  }
  return [];
}

function cleanList(list: string[]): string[] {
  return list
    .map((s) => (s ?? "").trim())
    .filter((s) => s.length > 0); // ✅ prevents empty string -> SelectItem crash
}

function safeUrl(u: string): string {
  return baseURL ? `${baseURL}${u}` : u;
}

/* ---------------- PAGE ---------------- */

export default function AssociationCreate() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [district, setDistrict] = useState(""); // keep as string (API)
  const [rootArea, setRootArea] = useState(""); // if your backend needs "area" separately

  const [address, setAddress] = useState<AddressState>({
    street: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [taluks, setTaluks] = useState<string[]>([]);

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingTaluks, setLoadingTaluks] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddressChange = (field: keyof AddressState, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  /* ---------------- LOAD: STATES ---------------- */

  useEffect(() => {
    const loadStates = async () => {
      try {
        setLoadingStates(true);
        const res = await Axios.request<ApiListResponse>({
          method: SummaryApi.locations_states.method,
          url: safeUrl(SummaryApi.locations_states.url),
        });

        const list = cleanList(pickStringList(res.data));
        setStates(list);

        // auto-select first state if empty
        if (!address.state && list.length > 0) {
          handleAddressChange("state", list[0]);
        }
      } catch {
        // keep silent; you can show toast if needed
        setStates([]);
      } finally {
        setLoadingStates(false);
      }
    };

    loadStates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // baseURL + SummaryApi are stable constants

  /* ---------------- LOAD: DISTRICTS (depends on state) ---------------- */

  useEffect(() => {
    const state = address.state?.trim();
    if (!state) return;

    const loadDistricts = async () => {
      try {
        setLoadingDistricts(true);

        const res = await Axios.request<ApiListResponse>({
          method: SummaryApi.locations_districts.method,
          url: safeUrl(SummaryApi.locations_districts.url),
          params: { state }, // backend should read ?state=
        });

        const list = cleanList(pickStringList(res.data));
        setDistricts(list);

        // reset dependent fields
        setDistrict("");
        handleAddressChange("city", "");
        setRootArea("");
        setTaluks([]);
      } catch{
        setDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    };

    loadDistricts();
  }, [address.state]);

  /* ---------------- LOAD: TALUKS (depends on state + district) ---------------- */

  useEffect(() => {
    const state = address.state?.trim();
    const dist = district?.trim();
    if (!state || !dist) return;

    const loadTaluks = async () => {
      try {
        setLoadingTaluks(true);

        const res = await Axios.request<ApiListResponse>({
          method: SummaryApi.locations_taluks.method,
          url: safeUrl(SummaryApi.locations_taluks.url),
          params: { state, district: dist }, // backend should read ?state=&district=
        });

        const list = cleanList(pickStringList(res.data));
        setTaluks(list);

        // reset city/taluk when district changes
        handleAddressChange("city", "");
        setRootArea("");
      } catch {
        setTaluks([]);
      } finally {
        setLoadingTaluks(false);
      }
    };

    loadTaluks();
  }, [address.state, district]);

  /* ---------------- SELECT HANDLERS ---------------- */

  const onStateSelect = (value: string) => {
    // value is never empty because we filtered list
    handleAddressChange("state", value);
  };

  const onDistrictSelect = (value: string) => {
    setDistrict(value);
  };

  const onTalukSelect = (value: string) => {
    handleAddressChange("city", value);
    setRootArea(value); // keep your backend "area" in sync if needed
  };

  /* ---------------- LOGO UPLOAD ---------------- */

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
    const file = e.dataTransfer.files?.[0];
    if (file) handleLogoSelect(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const canSubmit = useMemo(() => {
    return (
      name.trim().length > 0 &&
      address.state.trim().length > 0 &&
      district.trim().length > 0 &&
      address.city.trim().length > 0
    );
  }, [name, address.state, district, address.city]);

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!canSubmit) {
      setErrorMsg("Please fill Name, State, District and City/Taluk.");
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("district", district.trim());
      formData.append("area", rootArea.trim() || address.city.trim());

      formData.append("address[street]", address.street);
      formData.append("address[area]", address.area);
      formData.append("address[city]", address.city);
      formData.append("address[state]", address.state);
      formData.append("address[pincode]", address.pincode);

      if (logoFile) formData.append("logo", logoFile);

      await Axios({
        method: SummaryApi.association_create.method,
        url: safeUrl(SummaryApi.association_create.url),
        data: formData,
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/admin/association/list");
    } catch{
      // best effort message
      setErrorMsg("Failed to create association");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white shadow-sm">
              <PlusCircle className="h-5 w-5" />
            </span>
            Create Association
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Add a new association with logo, location and address details.
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          className="text-slate-700 hover:bg-white/40"
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          {/* Left card */}
          <Card className="rounded-2xl border border-white/50 bg-white/70 shadow-sm backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-900">
                Association Details
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label className="text-slate-700" htmlFor="name">
                  Association Name
                </Label>
                <Input
                  id="name"
                  placeholder="TN Bike Dealers Association"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border-slate-200 bg-white/80 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* State + District */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-700">State</Label>

                  <Select value={address.state} onValueChange={onStateSelect}>
                    <SelectTrigger className="rounded-xl border-slate-200 bg-white/80 text-slate-900">
                      <SelectValue
                        placeholder={loadingStates ? "Loading states..." : "Select state"}
                      />
                    </SelectTrigger>
                    <SelectContent className="border border-white/60 bg-gray-600 backdrop-blur-xl">
                      {states.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">District</Label>

                  <Select value={district} onValueChange={onDistrictSelect} disabled={!address.state}>
                    <SelectTrigger className="rounded-xl border-slate-200 bg-white/80 text-slate-900 disabled:opacity-60">
                      <SelectValue
                        placeholder={
                          !address.state
                            ? "Select state first"
                            : loadingDistricts
                            ? "Loading districts..."
                            : "Select district"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="border border-white/60 bg-gray-600  backdrop-blur-xl">
                      {districts.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Taluk + Locality */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-700">City / Taluk</Label>

                  <Select
                    value={address.city}
                    onValueChange={onTalukSelect}
                    disabled={!district}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200 bg-white/80 text-slate-900 disabled:opacity-60">
                      <SelectValue
                        placeholder={
                          !district
                            ? "Select district first"
                            : loadingTaluks
                            ? "Loading taluks..."
                            : "Select city / taluk"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="border border-white/60 bg-gray-600  backdrop-blur-xl">
                      {taluks.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700">Locality / Exact Area</Label>
                  <Input
                    placeholder="Street / block / landmark"
                    value={address.area}
                    onChange={(e) => handleAddressChange("area", e.target.value)}
                    className="rounded-xl border-slate-200 bg-white/80 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Street */}
              <div className="space-y-2">
                <Label className="text-slate-700">Street / Address line</Label>
                <Textarea
                  rows={2}
                  placeholder="No. 10, XYZ Street, near ABC signal"
                  value={address.street}
                  onChange={(e) => handleAddressChange("street", e.target.value)}
                  className="rounded-xl border-slate-200 bg-white/80 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Pincode */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-700">Pincode</Label>
                  <Input
                    value={address.pincode}
                    onChange={(e) => handleAddressChange("pincode", e.target.value)}
                    className="rounded-xl border-slate-200 bg-white/80 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right card */}
          <Card className="rounded-2xl border border-white/50 bg-white/70 shadow-sm backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-900">
                Association Logo
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div
                className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 py-10 text-center text-slate-600 shadow-sm transition hover:bg-white/80"
                onDrop={onDrop}
                onDragOver={onDragOver}
              >
                {logoPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-h-36 w-auto rounded-xl bg-white p-2 shadow-sm"
                    />
                    <p className="text-xs text-slate-500">
                      Drag & drop to replace or choose another file.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white shadow-sm">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      Drag & drop logo here
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      PNG, JPG, SVG, up to 2MB.
                    </p>
                  </>
                )}

                <input
                  id="logo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileInputChange}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-xl border-slate-200 bg-white/80 hover:bg-white"
                  onClick={() =>
                    (document.getElementById("logo") as HTMLInputElement | null)?.click()
                  }
                >
                  Choose file
                </Button>
              </div>

              <p className="text-xs text-slate-500">
                This logo will be shown in the admin panel and user app wherever
                this association appears.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bottom actions */}
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className="rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white hover:opacity-95 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Association
          </Button>

          {errorMsg && <span className="text-sm font-medium text-rose-600">{errorMsg}</span>}
        </div>
      </form>
    </div>
  );
}
