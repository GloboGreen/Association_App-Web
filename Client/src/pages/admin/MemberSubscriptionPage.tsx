import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import SummaryApi, { path } from "@/constants/SummaryApi";
import { raw } from "@/lib/Axios";

/* ---------------- Types ---------------- */
type Member = {
  _id: string;
  fullName?: string;
  name?: string;
  mobile?: string;
  email?: string;
  shopName?: string;
};

type Status = "PAID" | "FAILED";
type PaymentMode = "CASH" | "UPI" | "BANK" | "CARD" | "OTHER";

type CustomField = { key: string; value: string };

/* ---------------- Small utilities ---------------- */
function toMonthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
function toDateInputValue(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function safeMemberName(m?: Member) {
  return m?.fullName || m?.name || "Member";
}

/* ---------------- UI classes ---------------- */
const glassCard =
  "border border-white/30 bg-white/30 backdrop-blur-xl shadow-sm rounded-2xl";
const glassInner =
  "bg-white/40 border border-white/30 backdrop-blur rounded-2xl";
const glassInput =
  "bg-white/60 border-white/40 focus:border-white/60 focus:ring-0 rounded-xl";

/* -------------------------------------------------------
   Component: Upsert only
------------------------------------------------------- */
export default function SubscriptionUpsertPage() {
  const navigate = useNavigate();

  /* ----- members ----- */
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string>("");

  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const selectedMember = useMemo(
    () => members.find((m) => m._id === selectedMemberId),
    [members, selectedMemberId]
  );

  /* ----- form ----- */
  const [monthKey, setMonthKey] = useState<string>(toMonthKey(new Date()));
  const [paidDate, setPaidDate] = useState<string>(toDateInputValue(new Date()));
  const [subscriptionAmount, setSubscriptionAmount] = useState<number>(600);
  const [meetingAmount, setMeetingAmount] = useState<number>(0);
  const [status, setStatus] = useState<Status>("PAID");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [referenceNo, setReferenceNo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  /* ----- custom fields ----- */
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customKey, setCustomKey] = useState("");
  const [customValue, setCustomValue] = useState("");

  /* ----- UX ----- */
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setMembersLoading(true);
    setMembersError("");
    try {
      const res = await raw.get(SummaryApi.user_list.url, { withCredentials: true });
      const list: Member[] =
        (res as any).data?.data ?? (res as any).data?.members ?? (res as any).data ?? [];
      setMembers(Array.isArray(list) ? list : []);
    } catch {
      setMembersError("Failed to load members. Check /api/admin/members and adminAuth/cookies.");
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }

  function addCustomField() {
    const k = customKey.trim();
    if (!k) return;

    setCustomFields((prev) => {
      const idx = prev.findIndex((p) => p.key.trim().toLowerCase() === k.toLowerCase());
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { key: k, value: customValue };
        return copy;
      }
      return [...prev, { key: k, value: customValue }];
    });

    setCustomKey("");
    setCustomValue("");
  }

  function removeCustomField(key: string) {
    setCustomFields((prev) => prev.filter((f) => f.key !== key));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!selectedMemberId) {
      setMessage("Select a member first.");
      return;
    }

    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      setMessage("Month must be in YYYY-MM format.");
      return;
    }

    setSaving(true);
    try {
      const extrasObj = customFields.reduce<Record<string, string>>((acc, f) => {
        if (f.key.trim()) acc[f.key.trim()] = f.value ?? "";
        return acc;
      }, {});

      const url = path(SummaryApi.sub_upsert.url, { memberId: selectedMemberId });

      if (receiptFile) {
        const fd = new FormData();
        fd.append("monthKey", monthKey);
        fd.append("paidDate", paidDate);
        fd.append("subscriptionAmount", String(subscriptionAmount || 0));
        fd.append("meetingAmount", String(meetingAmount || 0));
        fd.append("status", status);
        fd.append("paymentMode", paymentMode);
        fd.append("referenceNo", referenceNo);
        fd.append("notes", notes);
        fd.append("extras", JSON.stringify(extrasObj));
        fd.append("receipt", receiptFile);

        await raw.post(url, fd, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await raw.post(
          url,
          {
            monthKey,
            paidDate,
            subscriptionAmount: subscriptionAmount || 0,
            meetingAmount: meetingAmount || 0,
            status,
            paymentMode,
            referenceNo,
            notes,
            extras: extrasObj,
          },
          { withCredentials: true }
        );
      }

      setMessage("Subscription saved successfully.");

      // optional: clear receipt after save
      setReceiptFile(null);

      // go to history page (recommended)
      navigate("/admin/subscriptions/history");
    } catch (err: any) {
      setMessage(err?.response?.data?.message || "Failed to save subscription.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-6">


      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Subscription Create / Update
          </h1>
          <p className="text-sm text-slate-700">
            Create or update monthly subscription records for a selected member.
          </p>
        </div>

        {/* Form */}
        <Card className={glassCard}>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base text-slate-900">Member Monthly Subscription</CardTitle>
              <p className="text-sm text-slate-700">
                After saving, you will be redirected to Subscription History.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => navigate("/admin/subscriptions/history")}
              className="bg-white/60 border border-white/40 text-slate-900 hover:bg-white/70 rounded-xl"
            >
              View History
            </Button>
          </CardHeader>

          <CardContent>
            <form onSubmit={onSave} className="space-y-6">
              {/* Member + month + date */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-slate-900">Member</Label>

                  <Popover open={memberPopoverOpen} onOpenChange={setMemberPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        disabled={membersLoading}
                        className="w-full justify-between rounded-xl border border-white/40 bg-white/60 text-slate-900 hover:bg-white/70"
                      >
                        {selectedMemberId ? safeMemberName(selectedMember) : "Select Member"}
                        <span className="text-slate-600">▾</span>
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent
                      align="start"
                      className="w-[380px] p-2 rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl"
                    >
                      <Command className="bg-white text-slate-900">
                        <CommandInput
                          placeholder="Search name / shop / mobile..."
                          className="h-10 bg-white text-slate-900"
                        />

                        <CommandList className="max-h-[320px] overflow-y-auto">
                          <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                            No members found.
                          </CommandEmpty>

                          <CommandGroup heading="Members" className="text-slate-700">
                            {members.map((m) => (
                              <CommandItem
                                key={m._id}
                                value={`${safeMemberName(m)} ${m.shopName ?? ""} ${m.mobile ?? ""} ${m.email ?? ""}`.toLowerCase()}
                                className="cursor-pointer rounded-xl aria-selected:bg-slate-100"
                                onSelect={() => {
                                  setSelectedMemberId(m._id);
                                  setMemberPopoverOpen(false);
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-900">{safeMemberName(m)}</span>
                                  <span className="text-xs text-slate-500">
                                    {(m.shopName ? `${m.shopName} • ` : "") +
                                      (m.mobile ? `+91 ${m.mobile}` : m.email || "")}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>

                      {membersError ? <p className="mt-2 text-xs text-red-600">{membersError}</p> : null}
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-900">Month (YYYY-MM)</Label>
                  <Input
                    value={monthKey}
                    onChange={(e) => setMonthKey(e.target.value)}
                    placeholder="2025-12"
                    className={glassInput}
                    disabled={!selectedMemberId}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-900">Paid Date</Label>
                  <Input
                    type="date"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    className={glassInput}
                    disabled={!selectedMemberId}
                  />
                </div>
              </div>

              {/* amounts + status + mode */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-slate-900">Subscription Amount</Label>
                  <Input
                    type="number"
                    value={subscriptionAmount}
                    onChange={(e) => setSubscriptionAmount(Number(e.target.value))}
                    className={glassInput}
                    disabled={!selectedMemberId}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-900">Missing Meeting Amount</Label>
                  <Input
                    type="number"
                    value={meetingAmount}
                    onChange={(e) => setMeetingAmount(Number(e.target.value))}
                    className={glassInput}
                    disabled={!selectedMemberId}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-900">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as Status)} disabled={!selectedMemberId}>
                    <SelectTrigger className="bg-white/60 border-white/40 rounded-xl">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAID">PAID</SelectItem>
                      <SelectItem value="FAILED">FAILED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-900">Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)} disabled={!selectedMemberId}>
                    <SelectTrigger className="bg-white/60 border-white/40 rounded-xl">
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">CASH</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="BANK">BANK</SelectItem>
                      <SelectItem value="CARD">CARD</SelectItem>
                      <SelectItem value="OTHER">OTHER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reference + receipt */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-900">Reference No / UTR (optional)</Label>
                  <Input
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className={glassInput}
                    disabled={!selectedMemberId}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-900">Receipt (optional)</Label>
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                    className={glassInput}
                    disabled={!selectedMemberId}
                  />
                  {receiptFile ? <p className="text-xs text-slate-600">Selected: {receiptFile.name}</p> : null}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-slate-900">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-white/60 border-white/40 focus:border-white/60 focus:ring-0 rounded-xl min-h-[90px]"
                  disabled={!selectedMemberId}
                />
              </div>

              {/* Custom fields */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-900">More Fields (Custom)</Label>
                  <span className="text-xs text-slate-600">Add field name + value</span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                  <div className="md:col-span-2">
                    <Input
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                      placeholder="Field name (e.g., Fine Discount)"
                      className={glassInput}
                      disabled={!selectedMemberId}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      placeholder="Value (e.g., 50)"
                      className={glassInput}
                      disabled={!selectedMemberId}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Button
                      type="button"
                      onClick={addCustomField}
                      disabled={!selectedMemberId || !customKey.trim()}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                    >
                      Add Field
                    </Button>
                  </div>
                </div>

                {customFields.length ? (
                  <div className={`${glassInner} p-3`}>
                    <div className="flex flex-wrap gap-2">
                      {customFields.map((f) => (
                        <div
                          key={f.key}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/60 border border-white/40"
                        >
                          <div className="text-sm text-slate-900">
                            <span className="font-semibold">{f.key}:</span>{" "}
                            <span className="text-slate-700">{f.value}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeCustomField(f.key)}
                            className="text-xs text-red-700 hover:underline"
                          >
                            remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Save bar */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  {message ? (
                    <p
                      className={`text-sm ${
                        message.toLowerCase().includes("fail") ||
                        message.toLowerCase().includes("error")
                          ? "text-red-700"
                          : "text-emerald-700"
                      }`}
                    >
                      {message}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-600">
                      {selectedMemberId
                        ? `Updating ${safeMemberName(selectedMember)} for ${monthKey}.`
                        : "Select a member to enable saving."}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={saving || !selectedMemberId}
                  className={
                    !selectedMemberId
                      ? "bg-slate-400 text-white cursor-not-allowed rounded-xl"
                      : "bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                  }
                >
                  {saving ? "Saving..." : "Save Subscription"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
