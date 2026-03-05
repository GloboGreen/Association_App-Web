// src/pages/admin/MyProfile.tsx
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import Axios from "@/lib/Axios";
import SummaryApi from "@/constants/SummaryApi";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setUser } from "@/redux/slices/auth.slice";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

type ProfileUser = {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  avatar?: string;
  provider?: "local" | "google";
};

export default function MyProfile() {
  const reduxUser = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [user, setUserState] = useState<ProfileUser | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await Axios.get(SummaryApi.auth_me.url);
        const u = res.data?.user as ProfileUser | undefined;

        if (u) {
          setUserState(u);
          if (u.avatar) setAvatarPreview(u.avatar);
        } else {
          setErrorMsg("Failed to load profile.");
        }
      } catch (err) {
        console.error("Failed to load profile", err);
        setErrorMsg("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const initials = useMemo(() => {
    const n = user?.name?.trim() || "";
    if (!n) return "U";
    const parts = n.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "U";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (a + b).toUpperCase();
  }, [user?.name]);

  const updateField = (field: keyof ProfileUser, value: any) => {
    setUserState((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("name", user.name || "");
      formData.append("mobile", user.mobile || "");

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await Axios.patch(
        SummaryApi.user_profile_update.url,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const updated: ProfileUser | undefined = res.data?.user;
      if (!updated) {
        setErrorMsg("Failed to update profile.");
        return;
      }

      setUserState(updated);
      if (updated.avatar) setAvatarPreview(updated.avatar);

      if (reduxUser) {
        dispatch(
          setUser({
            ...reduxUser,
            name: updated.name,
            avatar: updated.avatar,
          })
        );
      }

      setSuccessMsg("Profile updated successfully.");
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || "Failed to update profile.";
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------
   * Loading / Error states
   * --------------------------- */
  if (loading) {
    return (
      <div className="min-h-[100dvh] w-full grid place-items-center px-3 sm:px-4">
        <div className="w-full max-w-xl">
          <Card className="border border-slate-200 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">My Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading profile...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] w-full grid place-items-center px-3 sm:px-4">
        <div className="w-full max-w-xl">
          <Card className="border border-slate-200 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">My Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-600">
                Failed to load profile. Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* ---------------------------
   * Main UI
   * --------------------------- */
  return (
    <div className="min-h-[60dvh] w-full bg-white/20 px-3 sm:px-4 md:px-6 py-6 md:py-8 rounded-2xl">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Header (mobile -> desktop) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
              My Profile
            </h1>
            <p className="text-sm text-slate-500">
              Manage your account details
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-base text-slate-900">
                Account
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-6">
              {/* Avatar + Actions (responsive) */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar className="w-16 h-16 ring-2 ring-slate-200 shrink-0">
                    <AvatarImage
                      src={avatarPreview || undefined}
                      alt={user.name || "User avatar"}
                    />
                    <AvatarFallback className="bg-slate-100 text-slate-700 font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex w-full sm:w-auto gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() =>
                      (
                        document.getElementById("avatar-input") as
                          | HTMLInputElement
                          | null
                      )?.click()
                    }
                  >
                    Change Avatar
                  </Button>

                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              {/* Fields grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={user.name || ""}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input
                    id="mobile"
                    value={user.mobile || ""}
                    onChange={(e) => updateField("mobile", e.target.value)}
                    className="bg-white"
                  />
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-slate-50"
                  />
                </div>
              </div>

              {/* Messages */}
              {(errorMsg || successMsg) && (
                <div className="pt-1">
                  {errorMsg && (
                    <p className="text-sm text-red-600">{errorMsg}</p>
                  )}
                  {successMsg && (
                    <p className="text-sm text-emerald-600">{successMsg}</p>
                  )}
                </div>
              )}

              {/* Actions (mobile full width) */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
