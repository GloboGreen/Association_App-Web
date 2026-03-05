import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Axios from "@/lib/Axios";
import SummaryApi from "@/constants/SummaryApi";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Store,
  MapPin,
  UserCircle2,
  MessageCircle,
  ImageIcon,
  FileText,
  ExternalLink,
  ShieldCheck,
  ShieldX,
  Clock3,
  BadgeCheck,
  BadgeX,
  Copy,
} from "lucide-react";

/* ---------------- TYPES ---------------- */

type Address = {
  street?: string;
  area?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
};

type User = {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  whatsappNumber?: string;
  avatar?: string;

  status?: "Active" | "Inactive" | "Suspended" | string;
  role: "ADMIN" | "USER" | "OWNER" | "EMPLOYEE" | string;

  BusinessType?: "WHOLESALE" | "RETAIL" | string;
  BusinessCategory?: string;
  RegistrationNumber?: string;

  shopName?: string;
  address?: Address;
  shopAddress?: Address;

  shopFront?: string;
  shopBanner?: string;

  verify_email?: boolean;
  isProfileVerified?: boolean;

  association?: string | { _id: string };

  last_login_date?: string | null;
  createdAt: string;
};

type Association = {
  _id: string;
  name: string;
  logo?: string;
  district?: string;
  area?: string;
  address?: Address;
  isActive?: boolean;
};

type KycStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | string;

type KycDoc = {
  _id: string;
  owner: string | { _id: string; name?: string; email?: string };
  status: KycStatus;
  remarks?: string;

  reviewedBy?: { _id: string; name?: string; email?: string } | string;
  reviewedAt?: string;

  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  aadhaarPdfUrl?: string;

  gstCertUrl?: string;
  udyamCertUrl?: string;

  createdAt?: string;
  updatedAt?: string;
};

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
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return "—";
  }
}

function fullAddress(a?: Address) {
  if (!a) return "—";
  const s = [a.street, a.area, a.city, a.district, a.state, a.pincode]
    .filter(Boolean)
    .join(", ");
  return s || "—";
}

function getStatusMeta(status: KycStatus) {
  const s = String(status || "").toUpperCase();

  if (s === "APPROVED") {
    return {
      label: "APPROVED",
      badge: "bg-emerald-600 text-white",
      dot: "bg-emerald-500",
      Icon: BadgeCheck,
    };
  }
  if (s === "REJECTED") {
    return {
      label: "REJECTED",
      badge: "bg-rose-600 text-white",
      dot: "bg-rose-500",
      Icon: BadgeX,
    };
  }
  if (s === "PENDING") {
    return {
      label: "PENDING",
      badge: "bg-amber-500 text-white",
      dot: "bg-amber-500",
      Icon: Clock3,
    };
  }

  return {
    label: "NOT SUBMITTED",
    badge: "bg-slate-200 text-slate-900",
    dot: "bg-slate-400",
    Icon: FileText,
  };
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
}

function DocLink({ label, url }: { label: string; url?: string }) {
  if (!url) {
    return (
      <div className="rounded-xl border bg-white/60 px-3 py-2 text-xs text-slate-600">
        {label}: <span className="font-medium text-slate-800">Not uploaded</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-white/60 px-3 py-2">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-800">{label}</div>
        <div className="truncate text-[11px] text-slate-600">{url}</div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-xl"
          onClick={() => copyText(url)}
          title="Copy link"
        >
          <Copy className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-xl"
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          title="Open"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ---------------- PAGE ---------------- */

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [association, setAssociation] = useState<Association | null>(null);
  const [kyc, setKyc] = useState<KycDoc | null>(null);

  const [loading, setLoading] = useState(true);
  const [kycLoading, setKycLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [reviewBusy, setReviewBusy] = useState(false);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        // 1) User
        const res = await Axios.get(
          SummaryApi.user_detail.url.replace(":id", id)
        );
        const u: User | null = res.data?.user || null;
        setUser(u);

        // 2) Association
        if (u?.association) {
          const associationId =
            typeof u.association === "string"
              ? u.association
              : (u.association as any)?._id;

          if (associationId) {
            try {
              const aRes = await Axios.get(
                SummaryApi.association_detail.url.replace(":id", associationId)
              );
              setAssociation(aRes.data?.data || null);
            } catch (assocErr) {
              console.error("Failed to load association", assocErr);
              setAssociation(null);
            }
          }
        }

        // 3) KYC (Admin -> by ownerId)
        if (u?._id) {
          try {
            setKycLoading(true);
            const kRes = await Axios.get(
              SummaryApi.kyc_by_owner.url.replace(":ownerId", u._id)
            );
            const k: KycDoc | null = kRes.data?.data || null;
            setKyc(k);
            setRemarks(k?.remarks || "");
          } catch (kErr) {
            console.error("Failed to load kyc", kErr);
            setKyc(null);
          } finally {
            setKycLoading(false);
          }
        }
      } catch (err) {
        console.error("Failed to load user", err);
        setErrorMsg("Failed to load user details.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  const created = useMemo(() => safeDateLabel(user?.createdAt), [user?.createdAt]);
  const lastLogin = useMemo(
    () => safeDateLabel(user?.last_login_date),
    [user?.last_login_date]
  );

  const emailVerified = !!user?.verify_email;
  const profileVerified = !!user?.isProfileVerified;

  const associationLabel = useMemo(() => {
    if (!association) return "";
    return [association.name, association.district, association.area]
      .filter(Boolean)
      .join(" · ");
  }, [association]);

  const kycMeta = useMemo(
    () => getStatusMeta(kyc?.status || "NOT_SUBMITTED"),
    [kyc?.status]
  );

  const hasAadhaarPdf = !!kyc?.aadhaarPdfUrl;
  const hasAadhaarImages = !!kyc?.aadhaarFrontUrl && !!kyc?.aadhaarBackUrl;
  const hasAnyDoc = !!(
    hasAadhaarPdf ||
    hasAadhaarImages ||
    kyc?.gstCertUrl ||
    kyc?.udyamCertUrl
  );

  const handleReview = async (status: "APPROVED" | "REJECTED") => {
    if (!kyc?._id) return;
    try {
      setReviewBusy(true);

      const payload = {
        status,
        remarks: remarks?.trim() || "",
      };

      await Axios.patch(
        SummaryApi.kyc_admin_review.url.replace(":kycId", kyc._id),
        payload
      );

      setKyc((prev) =>
        prev
          ? {
              ...prev,
              status,
              remarks: payload.remarks,
              reviewedAt: new Date().toISOString(),
            }
          : prev
      );
    } catch (err) {
      console.error("Failed to review KYC", err);
      alert("Failed to review KYC.");
    } finally {
      setReviewBusy(false);
    }
  };

  /* ---------------- LOADING / EMPTY ---------------- */

  if (loading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6">
        <Card className="rounded-2xl border border-white/40 bg-white/55 backdrop-blur-xl shadow-sm">
          <CardHeader className="border-b border-white/40">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit rounded-xl bg-white/50 hover:bg-white/70"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <CardTitle className="text-slate-900">User Details</CardTitle>
          </CardHeader>
          <CardContent className="py-10">
            <p className="flex items-center gap-2 text-sm text-slate-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading user…
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6">
        <Card className="rounded-2xl border border-white/40 bg-white/55 backdrop-blur-xl shadow-sm">
          <CardHeader className="border-b border-white/40">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit rounded-xl bg-white/50 hover:bg-white/70"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <CardTitle className="text-slate-900">User Details</CardTitle>
          </CardHeader>
          <CardContent className="py-10">
            <p className="text-sm text-rose-700">
              User not found or failed to load.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 space-y-6">
      {errorMsg && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}

      <Card className="rounded-2xl border border-white/40 bg-white/55 backdrop-blur-xl shadow-sm overflow-hidden">
        <CardHeader className="border-b border-white/40 bg-white/40">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit rounded-xl bg-white/50 hover:bg-white/70 text-slate-900"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="flex flex-wrap gap-2 max-w-full">
              <Badge variant="outline" className="uppercase text-[10px]">
                {user.role}
              </Badge>

              <Badge
                className={
                  emailVerified
                    ? "bg-emerald-600 text-white"
                    : "bg-white/70 text-slate-800 border border-white/60"
                }
              >
                {emailVerified ? "Email Verified" : "Email Not Verified"}
              </Badge>

              <Badge
                className={
                  profileVerified
                    ? "bg-emerald-600 text-white"
                    : "bg-white/70 text-slate-800 border border-white/60"
                }
              >
                {profileVerified ? "Profile Verified" : "Profile Pending"}
              </Badge>

              <Badge
                className={
                  user.status === "Active"
                    ? "bg-emerald-700 text-white"
                    : "bg-white/70 text-slate-800 border border-white/60"
                }
              >
                {user.status || "—"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-16 w-16 ring-2 ring-white/60">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-white/80 text-slate-900">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                {user.name}
                <UserCircle2 className="w-5 h-5 text-slate-500" />
              </CardTitle>

              <div className="mt-2 grid gap-1 text-sm text-slate-700 max-w-full">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>

                {user.mobile && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span className="break-words">{user.mobile}</span>
                  </div>
                )}

                {user.whatsappNumber && (
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-slate-500" />
                    <span className="break-words">WhatsApp: {user.whatsappNumber}</span>
                  </div>
                )}

                {associationLabel && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
                    <Store className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{associationLabel}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    Created: {created}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    Last login: {lastLogin}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
            {/* Address */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <MapPin className="h-4 w-4 text-slate-600" />
                Address
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/60 p-4 text-sm text-slate-800 break-words">
                {fullAddress(user.address)}
              </div>
            </div>

            {/* Business */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Store className="h-4 w-4 text-slate-600" />
                Business / Shop
              </div>

              <div className="rounded-2xl border border-white/60 bg-white/60 p-4 text-sm">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-600">Shop Name</span>
                    <span className="font-semibold text-slate-900 break-words text-right">
                      {user.shopName || "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-600">Business Type</span>
                    <span className="font-semibold text-slate-900 break-words text-right">
                      {user.BusinessType || "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-600">Category</span>
                    <span className="font-semibold text-slate-900 break-words text-right">
                      {user.BusinessCategory || "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-600">Reg. Number</span>
                    <span className="font-semibold text-slate-900 break-words text-right">
                      {user.RegistrationNumber || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Association */}
            <div className="space-y-3 xl:col-span-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Store className="h-4 w-4 text-slate-600" />
                Association
              </div>

              <div className="rounded-2xl border border-white/60 bg-white/60 p-4">
                {association ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 overflow-hidden rounded-full border border-white/70 bg-white/70 shrink-0">
                        {association.logo ? (
                          <img
                            src={association.logo}
                            alt={association.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                            A
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {association.name}
                        </div>
                        <div className="text-xs text-slate-600 truncate">
                          {association.district || "—"}
                          {association.area ? ` · ${association.area}` : ""}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-600">
                          Status:{" "}
                          <span className="font-semibold text-slate-900">
                            {association.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-white/60" />

                    <div>
                      <div className="mb-1 text-xs font-semibold text-slate-700">
                        Association Address
                      </div>
                      <div className="text-sm text-slate-800 break-words">
                        {fullAddress(association.address)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-600">
                    No association linked or failed to load.
                  </div>
                )}
              </div>
            </div>

            {/* Shop Address */}
            <div className="space-y-3 xl:col-span-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <MapPin className="h-4 w-4 text-slate-600" />
                Shop Address
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/60 p-4 text-sm text-slate-800 break-words">
                {fullAddress(user.shopAddress)}
              </div>
            </div>

            {/* Shop Photos */}
            <div className="space-y-3 xl:col-span-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ImageIcon className="h-4 w-4 text-slate-600" />
                Shop Photos
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700">
                    Shop Front
                  </div>
                  {user.shopFront ? (
                    <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/60">
                      <img
                        src={user.shopFront}
                        alt="Shop Front"
                        className="h-40 sm:h-44 md:h-52 w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/60 bg-white/60 p-4 text-xs text-slate-600">
                      No image uploaded
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700">
                    Shop Banner
                  </div>
                  {user.shopBanner ? (
                    <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/60">
                      <img
                        src={user.shopBanner}
                        alt="Shop Banner"
                        className="h-40 sm:h-44 md:h-52 w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/60 bg-white/60 p-4 text-xs text-slate-600">
                      No image uploaded
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* KYC SECTION */}
            <div className="space-y-3 xl:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FileText className="h-4 w-4 text-slate-600" />
                  KYC Documents
                </div>

                {kycLoading ? (
                  <span className="flex items-center gap-2 text-xs text-slate-600">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading KYC…
                  </span>
                ) : null}
              </div>

              <div className="rounded-2xl border border-white/60 bg-white/60 p-4">
                {!kyc ? (
                  <div className="text-sm text-slate-600">
                    No KYC record found for this user.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Status row */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${kycMeta.dot}`} />
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${kycMeta.badge}`}
                        >
                          <kycMeta.Icon className="h-3.5 w-3.5" />
                          {kycMeta.label}
                        </span>

                        {hasAnyDoc ? (
                          <Badge className="bg-white/70 text-slate-800 border border-white/70">
                            Docs: Uploaded
                          </Badge>
                        ) : (
                          <Badge className="bg-white/70 text-slate-800 border border-white/70">
                            Docs: None
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-slate-600">
                        Updated:{" "}
                        <span className="font-semibold text-slate-900">
                          {safeDateLabel(kyc.updatedAt || null)}
                        </span>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                      <DocLink label="Aadhaar PDF" url={kyc.aadhaarPdfUrl} />
                      <DocLink label="GST Certificate" url={kyc.gstCertUrl} />
                      <DocLink label="Udyam Certificate" url={kyc.udyamCertUrl} />

                      {/* Aadhaar images row */}
                      <div className="rounded-2xl border bg-white/60 p-3 md:col-span-2">
                        <div className="mb-2 text-xs font-semibold text-slate-800">
                          Aadhaar Images (Front / Back)
                        </div>

                        {hasAadhaarImages ? (
                          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                            <div className="overflow-hidden rounded-xl border bg-white/70">
                              <img
                                src={kyc.aadhaarFrontUrl}
                                alt="Aadhaar Front"
                                className="h-40 sm:h-44 md:h-52 w-full object-cover"
                              />
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[11px] font-semibold text-slate-800">
                                  Front
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded-xl"
                                  onClick={() =>
                                    window.open(
                                      kyc.aadhaarFrontUrl!,
                                      "_blank",
                                      "noopener,noreferrer"
                                    )
                                  }
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Open
                                </Button>
                              </div>
                            </div>

                            <div className="overflow-hidden rounded-xl border bg-white/70">
                              <img
                                src={kyc.aadhaarBackUrl}
                                alt="Aadhaar Back"
                                className="h-40 sm:h-44 md:h-52 w-full object-cover"
                              />
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[11px] font-semibold text-slate-800">
                                  Back
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded-xl"
                                  onClick={() =>
                                    window.open(
                                      kyc.aadhaarBackUrl!,
                                      "_blank",
                                      "noopener,noreferrer"
                                    )
                                  }
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Open
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-600">
                            Aadhaar images not uploaded.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Remarks */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-700">
                        Admin Remarks (optional)
                      </div>
                      <Textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="min-h-[90px] rounded-2xl border-white/60 bg-white/70 text-slate-900 placeholder:text-slate-400"
                        placeholder="Enter remarks for approve/reject…"
                      />
                    </div>

                    {/* Review actions */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs text-slate-600">
                        Reviewed At:{" "}
                        <span className="font-semibold text-slate-900">
                          {safeDateLabel(kyc.reviewedAt || null)}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                          type="button"
                          disabled={reviewBusy || !kyc._id || !hasAnyDoc}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                          onClick={() => handleReview("APPROVED")}
                        >
                          {reviewBusy ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="mr-2 h-4 w-4" />
                          )}
                          Approve
                        </Button>

                        <Button
                          type="button"
                          disabled={reviewBusy || !kyc._id || !hasAnyDoc}
                          className="rounded-xl bg-rose-600 hover:bg-rose-700 w-full sm:w-auto"
                          onClick={() => handleReview("REJECTED")}
                        >
                          {reviewBusy ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ShieldX className="mr-2 h-4 w-4" />
                          )}
                          Reject
                        </Button>
                      </div>
                    </div>

                    {!hasAnyDoc ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        This user has no uploaded KYC documents. Approve/Reject is disabled.
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
            {/* END KYC */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
