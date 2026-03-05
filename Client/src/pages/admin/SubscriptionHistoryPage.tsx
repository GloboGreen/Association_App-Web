import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Separator } from "@/components/ui/separator";

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
type StatusFilter = "ALL" | Status;
type PaymentMode = "CASH" | "UPI" | "BANK" | "CARD" | "OTHER";

type HistoryRow = {
  _id: string;
  member?: Member;
  monthKey: string;
  subscriptionAmount: number;
  meetingAmount?: number;
  status: Status;
  paidDate?: string;
  paymentMode?: PaymentMode;
  referenceNo?: string;
  notes?: string;
  attachmentUrl?: string;
  extras?: Record<string, string>;
};

/* ---------------- Safe helpers (NO any) ---------------- */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function pickArray<T>(payload: unknown): T[] {
  if (!isRecord(payload)) return [];

  const candidates: unknown[] = [
    payload.data,
    payload.rows,
    payload.members,
    payload.items,
    payload.result,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) return c as T[];
  }

  // Sometimes API returns array directly as payload
  if (Array.isArray(payload)) return payload as T[];

  return [];
}

function safeMemberName(m?: Member) {
  return m?.fullName || m?.name || "Member";
}

function fmtINR(n: number) {
  try {
    return n.toLocaleString("en-IN");
  } catch {
    return String(n);
  }
}

function isStatusFilter(v: string): v is StatusFilter {
  return v === "ALL" || v === "PAID" || v === "FAILED";
}

/* ---------------- UI classes ---------------- */
const glassCard =
  "border border-white/30 bg-white/30 backdrop-blur-xl shadow-sm rounded-2xl";
const glassInner =
  "bg-white/40 border border-white/30 backdrop-blur rounded-2xl";
const glassInput =
  "bg-white/60 border-white/40 focus:border-white/60 focus:ring-0 rounded-xl";

export default function SubscriptionHistoryPage() {
  /* ----- members ----- */
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string>("");

  const [selectedMemberId, setSelectedMemberId] = useState<string>("ALL");
  const isAllMode = selectedMemberId === "ALL";
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);

  const selectedMember = useMemo(
    () => members.find((m) => m._id === selectedMemberId),
    [members, selectedMemberId]
  );

  /* ----- history ----- */
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  /* ----- filters ----- */
  const [filterMonth, setFilterMonth] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("ALL");
  const [searchText, setSearchText] = useState<string>("");

  const totals = useMemo(() => {
    const paid = history.filter((h) => h.status === "PAID").length;
    const failed = history.filter((h) => h.status === "FAILED").length;
    const sumSubscription = history.reduce(
      (acc, h) => acc + (h.subscriptionAmount || 0),
      0
    );
    const sumMeeting = history.reduce(
      (acc, h) => acc + (h.meetingAmount || 0),
      0
    );
    return { paid, failed, sumSubscription, sumMeeting };
  }, [history]);

  const filteredHistory = useMemo(() => {
    let rows = [...history];

    if (filterMonth !== "ALL") rows = rows.filter((r) => r.monthKey === filterMonth);
    if (filterStatus !== "ALL") rows = rows.filter((r) => r.status === filterStatus);

    const q = searchText.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => {
        const m = r.member;
        const blob = [
          safeMemberName(m),
          m?.shopName,
          m?.mobile,
          m?.email,
          r.monthKey,
          r.referenceNo,
          r.notes,
          JSON.stringify(r.extras || {}),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return blob.includes(q);
      });
    }
    return rows;
  }, [history, filterMonth, filterStatus, searchText]);

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    history.forEach((h) => set.add(h.monthKey));
    return Array.from(set).sort().reverse();
  }, [history]);

  useEffect(() => {
    void loadMembers();
    void loadHistoryAll();
  }, []);

  useEffect(() => {
    setFilterMonth("ALL");
    setFilterStatus("ALL");
    setSearchText("");

    if (isAllMode) void loadHistoryAll();
    else void loadHistoryMember(selectedMemberId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMemberId]);

  async function loadMembers() {
    setMembersLoading(true);
    setMembersError("");
    try {
      const res = await raw.get<unknown>(SummaryApi.user_list.url, {
        withCredentials: true,
      });

      // AxiosResponse<T> => res.data is unknown here
      const list = pickArray<Member>(res.data);
      setMembers(Array.isArray(list) ? list : []);
    } catch {
      setMembersError(
        "Failed to load members. Check /api/admin/members and adminAuth/cookies."
      );
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }

  async function loadHistoryAll() {
    setHistoryLoading(true);
    try {
      const res = await raw.get<unknown>(SummaryApi.sub_all_history.url, {
        withCredentials: true,
      });

      const rows = pickArray<HistoryRow>(res.data);
      setHistory(Array.isArray(rows) ? rows : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadHistoryMember(memberId: string) {
    if (!memberId || memberId === "ALL") return;
    setHistoryLoading(true);
    try {
      const url = path(SummaryApi.sub_member_history.url, { memberId });
      const res = await raw.get<unknown>(url, { withCredentials: true });

      const rows = pickArray<HistoryRow>(res.data);
      setHistory(Array.isArray(rows) ? rows : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-6">


      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Subscription History
          </h1>
          <p className="text-sm text-slate-700">
            View subscription history for all members or a specific member.
          </p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className={glassCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Subscription (History Sum)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                ₹ {fmtINR(totals.sumSubscription)}
              </div>
              <div className="text-xs text-slate-600 mt-1">Based on loaded history</div>
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Meeting Deduction (History Sum)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                ₹ {fmtINR(totals.sumMeeting)}
              </div>
              <div className="text-xs text-slate-600 mt-1">Missing meeting total</div>
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">PAID</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">{totals.paid}</div>
              <div className="text-xs text-slate-600 mt-1">Records</div>
            </CardContent>
          </Card>

          <Card className={glassCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">FAILED</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{totals.failed}</div>
              <div className="text-xs text-slate-600 mt-1">Records</div>
            </CardContent>
          </Card>
        </div>

        {/* Member selector + filters + table */}
        <Card className={glassCard}>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base text-slate-900">History Records</CardTitle>
              <p className="text-sm text-slate-700">
                {isAllMode ? "All Members" : safeMemberName(selectedMember)} records.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:w-[860px]">
              {/* Member filter */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-700">Member</Label>

                <Popover open={memberPopoverOpen} onOpenChange={setMemberPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      disabled={membersLoading}
                      className="w-full justify-between rounded-xl border border-white/40 bg-white/60 text-slate-900 hover:bg-white/70"
                    >
                      {isAllMode ? "All Members" : safeMemberName(selectedMember)}
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

                        <CommandGroup heading="Mode" className="text-slate-700">
                          <CommandItem
                            value="all-members"
                            className="cursor-pointer rounded-xl aria-selected:bg-slate-100"
                            onSelect={() => {
                              setSelectedMemberId("ALL");
                              setMemberPopoverOpen(false);
                            }}
                          >
                            All Members
                          </CommandItem>
                        </CommandGroup>

                        <Separator className="my-2" />

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
                                <span className="font-medium text-slate-900">
                                  {safeMemberName(m)}
                                </span>
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

                    {membersError ? (
                      <p className="mt-2 text-xs text-red-600">{membersError}</p>
                    ) : null}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Month */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-700">Filter Month</Label>

                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="bg-white/60 border-white/40 rounded-xl text-slate-900">
                    <SelectValue />
                  </SelectTrigger>

                  {/* FIX: white dropdown, no bg-black on items */}
                  <SelectContent className="bg-white text-slate-900 border border-slate-200 shadow-xl rounded-xl">
                    <SelectItem value="ALL">All</SelectItem>
                    {monthOptions.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-700">Filter Status</Label>

                <Select
                  value={filterStatus}
                  onValueChange={(v) => {
                    if (isStatusFilter(v)) setFilterStatus(v);
                  }}
                >
                  <SelectTrigger className="bg-white/60 border-white/40 rounded-xl text-slate-900">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent className="bg-white text-slate-900 border border-slate-200 shadow-xl rounded-xl">
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="PAID">PAID</SelectItem>
                    <SelectItem value="FAILED">FAILED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-700">Search</Label>
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="name / shop / mobile / ref / notes"
                  className={glassInput}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-700">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {filteredHistory.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-900">
                  {history.length}
                </span>{" "}
                records
              </p>

              <Button
                type="button"
                onClick={() =>
                  isAllMode ? void loadHistoryAll() : void loadHistoryMember(selectedMemberId)
                }
                className="bg-white/60 border border-white/40 text-slate-900 hover:bg-white/70 rounded-xl"
                disabled={historyLoading}
              >
                {historyLoading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>

            <div className={`overflow-x-auto ${glassInner}`}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white/70 backdrop-blur z-10">
                  <tr className="text-left text-slate-700">
                    <th className="px-4 py-3 font-semibold">Member</th>
                    <th className="px-4 py-3 font-semibold">Month</th>
                    <th className="px-4 py-3 font-semibold">Sub Amt</th>
                    <th className="px-4 py-3 font-semibold">Meeting</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Paid Date</th>
                    <th className="px-4 py-3 font-semibold">Mode</th>
                    <th className="px-4 py-3 font-semibold">Ref/UTR</th>
                    <th className="px-4 py-3 font-semibold">Receipt</th>
                  </tr>
                </thead>

                <tbody>
                  {historyLoading ? (
                    <tr>
                      <td className="px-4 py-6 text-slate-700" colSpan={9}>
                        Loading history...
                      </td>
                    </tr>
                  ) : filteredHistory.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-slate-700" colSpan={9}>
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((row) => (
                      <tr
                        key={row._id}
                        className="odd:bg-white/30 hover:bg-white/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">
                              {safeMemberName(row.member)}
                            </span>
                            <span className="text-xs text-slate-600">
                              {row.member?.shopName ? `${row.member.shopName} • ` : ""}
                              {row.member?.mobile
                                ? `+91 ${row.member.mobile}`
                                : row.member?.email || ""}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-slate-800">{row.monthKey}</td>
                        <td className="px-4 py-3 text-slate-800">
                          ₹ {fmtINR(row.subscriptionAmount || 0)}
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          ₹ {fmtINR(row.meetingAmount || 0)}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              row.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-slate-800">
                          {row.paidDate ? String(row.paidDate).slice(0, 10) : "-"}
                        </td>

                        <td className="px-4 py-3 text-slate-800">
                          {row.paymentMode || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          {row.referenceNo || "-"}
                        </td>

                        <td className="px-4 py-3">
                          {row.attachmentUrl ? (
                            <a
                              href={row.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-900 underline underline-offset-2 hover:text-slate-700"
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-slate-600">
              Tip: If members list is empty, check{" "}
              <span className="font-semibold">/api/admin/members</span> and adminAuth cookies.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
