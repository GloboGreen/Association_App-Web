import { useEffect, useMemo, useState } from "react";
import Axios from "@/lib/Axios";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, MapPin } from "lucide-react";
import SummaryApi from "@/constants/SummaryApi";

type ShopAddress = {
  street?: string;
  area?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
};

type ShopUser = {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  avatar?: string;
  status: "Active" | "Inactive" | "Suspended" | string;
  BusinessType?: "WHOLESALE" | "RETAIL" | string;
  BusinessCategory?: string;
  shopName: string;
  shopAddress?: ShopAddress;
};

const ITEMS_PER_PAGE = 10;

function formatShopAddress(addr?: ShopAddress): string {
  if (!addr) return "";
  const parts = [
    addr.area,
    addr.city,
    addr.district,
    addr.state,
    addr.pincode,
  ].filter(Boolean);
  return parts.join(", ");
}

export default function ShopList() {
  const [items, setItems] = useState<ShopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await Axios.get(SummaryApi.shop_list.url);
        setItems(res.data?.data || []);
      } catch (err) {
        console.error("Failed to load shops", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter((u) => {
      const addrText = formatShopAddress(u.shopAddress).toLowerCase();
      const fullText = `${u.shopName} ${u.name} ${u.email} ${
        u.mobile || ""
      } ${addrText}`.toLowerCase();
      return fullText.includes(term);
    });
  }, [items, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / ITEMS_PER_PAGE)
  );
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  if (loading) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Shops</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading shops...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-xl font-semibold">Shops</CardTitle>
        <div className="w-full max-w-xs">
          <Input
            placeholder="Search by shop, owner, city..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px]">Owner</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <span className="text-sm text-muted-foreground">
                      No shops found.
                    </span>
                  </TableCell>
                </TableRow>
              )}

              {pageItems.map((u) => (
                <TableRow key={u._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={u.avatar} alt={u.name} />
                        <AvatarFallback>
                          {u.name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{u.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {u.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold">{u.shopName}</span>
                      {u.BusinessCategory && (
                        <span className="text-xs text-muted-foreground">
                          {u.BusinessCategory}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>{u.mobile || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.BusinessType ? (
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {u.BusinessType}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-1 text-xs">
                      <MapPin className="mt-[2px] h-3 w-3" />
                      <span>{formatShopAddress(u.shopAddress) || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        u.status === "Active" ? "default" : "outline"
                      }
                      className={
                        u.status === "Active"
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : ""
                      }
                    >
                      {u.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Footer: pagination */}
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            {filtered.length > 0 ? (
              <>
                Showing{" "}
                <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {startIndex + pageItems.length}
                </span>{" "}
                of{" "}
                <span className="font-medium">{filtered.length}</span> shops
              </>
            ) : (
              "No results"
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </Button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <Button
                  key={p}
                  variant={p === currentPage ? "default" : "outline"}
                  size="sm"
                  className="px-3"
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
