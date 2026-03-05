import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import logo from "@/assets/logo.png";

import {
  Building2,
  ChevronDown,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  Users,
  X,
  Tags,
  Smartphone,
  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

/* ----------------------------- helpers ----------------------------- */

function cn(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

function initials(name: string): string {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* ----------------------------- constants ---------------------------- */

type MenuItem = { to: string; label: string; icon?: ReactNode };
type DropdownDef = {
  key: string;
  label: string;
  icon: ReactNode;
  activePrefix: string; // pathname startsWith
  items: MenuItem[];
};

const GRAD = "from-blue-600 via-purple-600 to-pink-500";

const styles = {
  headerWrap:
    "sticky top-0 z-40 w-full border-b border-white/40 bg-white/55 backdrop-blur-xl",
  container: "mx-auto flex h-16 max-w-7xl items-center gap-3 px-3 sm:px-4",

  // desktop links
  linkBase:
    "relative rounded-xl px-3 py-2 text-sm font-semibold transition-colors whitespace-nowrap",
  linkActive: "text-slate-900 bg-white/60 shadow-sm",
  linkIdle: "text-slate-700 hover:bg-white/40 hover:text-slate-900",

  // dropdown trigger button
  triggerBase:
    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
  triggerActive: "bg-white/60 text-slate-900 shadow-sm",
  triggerIdle: "text-slate-700 hover:bg-white/40 hover:text-slate-900",

  // dropdown surface
  dropdownSurface:
    "border border-white/60 bg-white/90 text-slate-900 backdrop-blur-xl p-1",
  dropdownItem:
    "cursor-pointer rounded-lg text-sm text-slate-800 focus:bg-slate-100 focus:text-slate-900",

  // mobile panel
  mobilePanel:
    "border-b border-white/40 bg-white/75 backdrop-blur-xl md:hidden",
  mobileWrap: "mx-auto max-w-7xl px-3 py-3 sm:px-4",
  mobileGrid: "grid gap-2",
  mobileLinkBase:
    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold",
  mobileActive: `bg-gradient-to-r ${GRAD} text-white`,
  mobileIdle: "bg-white/60 text-slate-900 hover:bg-white/80",
};

/* --------------------------- small components ----------------------- */

function DesktopNavItem({
  to,
  end,
  icon,
  label,
}: {
  to: string;
  end?: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          styles.linkBase,
          isActive ? styles.linkActive : styles.linkIdle
        )
      }
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        {label}
      </span>
    </NavLink>
  );
}

function DropdownNav({
  label,
  icon,
  active,
  items,
}: {
  label: string;
  icon: ReactNode;
  active: boolean;
  items: MenuItem[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            styles.triggerBase,
            active ? styles.triggerActive : styles.triggerIdle
          )}
        >
          {icon}
          {label}
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className={cn("min-w-56", styles.dropdownSurface)}
      >
        {items.map((it) => (
          <DropdownMenuItem key={it.to} asChild className={styles.dropdownItem}>
            <Link to={it.to} className="flex items-center gap-2">
              {it.icon}
              {it.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileLink({
  to,
  icon,
  label,
  onClick,
  end,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          styles.mobileLinkBase,
          isActive ? styles.mobileActive : styles.mobileIdle
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

/* ------------------------------ Topbar ------------------------------ */

export default function Topbar({
  userName = "Nandhakumar S",
  profilePercent = 80,
  avatarUrl = "",
}: {
  userName?: string;
  profilePercent?: number;
  avatarUrl?: string;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // close mobile on route change (important for UX)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

const dropdowns: DropdownDef[] = useMemo(
  () => [
    {
      key: "association",
      label: "Association",
      icon: <Building2 className="h-4 w-4" />,
      activePrefix: "/admin/association",
      items: [
        { to: "/admin/association/create", label: "Create", icon: <Building2 className="h-4 w-4" /> },
        { to: "/admin/association/list", label: "List", icon: <Building2 className="h-4 w-4" /> },
      ],
    },
    {
      key: "subscription",
      label: "Subscription",
      icon: <ShieldCheck className="h-4 w-4" />,
      activePrefix: "/admin/subscription",
      items: [
        { to: "/admin/subscription/update", label: "Update", icon: <ShieldCheck className="h-4 w-4" /> },
        { to: "/admin/subscription/history", label: "History", icon: <ShieldCheck className="h-4 w-4" /> },
      ],
    },
  ],
  []
);


  const handleLogout = () => {
    // TODO: call logout API if needed
    navigate("/login", { replace: true });
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className={styles.headerWrap}>
        <div className={styles.container}>
          {/* Logo */}
          <Link to="/admin" className="flex items-center gap-2">
            <img src={logo} alt="TNMA" className="h-8 w-auto" />
            <div className="hidden leading-tight sm:block">
              <div className="font-semibold tracking-wide text-slate-900">
                TAMIL NADU
              </div>
              <div className="text-[10px] text-slate-600">
                (MOBILE ASSOCIATION)
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-4 hidden items-center gap-2 md:flex">
            <DesktopNavItem
              to="/admin"
              end
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="Dashboard"
            />
            {/* Direct links */}
            <DesktopNavItem
              to="/admin/users"
              icon={<Users className="h-4 w-4" />}
              label="Users"
            />
            {/* Dropdowns */}
            {dropdowns.map((d) => (
              <DropdownNav
                key={d.key}
                label={d.label}
                icon={d.icon}
                active={pathname.startsWith(d.activePrefix)}
                items={d.items}
              />
            ))}
                        <DesktopNavItem
              to="/admin/brand"
              icon={<Tags className="h-4 w-4" />}
              label="Brand"
            />
                               <DesktopNavItem
              to="/admin/Series"
              icon={<Layers className="h-4 w-4" />}
              label="Series"
            />
                   <DesktopNavItem
              to="/admin/Model"
              icon={<Smartphone className="h-4 w-4" />}
              label="Model"
            />
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            {/* Mobile toggle */}
            <Button
              variant="ghost"
              className="md:hidden rounded-xl text-slate-900 hover:bg-white/40"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Profile menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 rounded-xl text-slate-900 hover:bg-white/40"
                >
                  <span className="hidden max-w-[180px] truncate text-sm font-semibold sm:inline">
                    {userName}
                  </span>

                  <Avatar className="h-8 w-8 ring-2 ring-white/60">
                    <AvatarImage src={avatarUrl || undefined} alt={userName} />
                    <AvatarFallback className="bg-white/80 text-slate-900">
                      {initials(userName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className={cn("min-w-64", styles.dropdownSurface, "bg-white/92")}
              >
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span className="font-semibold">{userName.toUpperCase()}</span>
                  <Badge className={cn("rounded-md bg-gradient-to-r text-white", GRAD)}>
                    {profilePercent}%
                  </Badge>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild className={styles.dropdownItem}>
                  <Link to="/admin/profile" className="flex items-center gap-2">
                    <UserRound className="h-4 w-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className={styles.dropdownItem}>
                  <Link
                    to="/admin/change-password"
                    className="flex items-center gap-2"
                  >
                    <KeyRound className="h-4 w-4" />
                    Change Password
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className={styles.dropdownItem}>
                  <Link
                    to="/admin/set-default-role"
                    className="flex items-center gap-2"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Set Default Role
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer rounded-lg text-sm text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className={styles.mobilePanel}>
          <div className={styles.mobileWrap}>
            <div className={styles.mobileGrid}>
              <MobileLink
                to="/admin"
                end
                icon={<LayoutDashboard className="h-4 w-4" />}
                label="Dashboard"
                onClick={closeMobile}
              />

              {/* Mobile uses direct links (best UX) */}
              <MobileLink
                to="/admin/association/create"
                icon={<Building2 className="h-4 w-4" />}
                label="Association Create"
                onClick={closeMobile}
              />
                            <MobileLink
                to="/admin/association/list"
                icon={<Building2 className="h-4 w-4" />}
                label="Association List"
                onClick={closeMobile}
              />
              <MobileLink
                to="/admin/users"
                icon={<Users className="h-4 w-4" />}
                label="Users"
                onClick={closeMobile}
              />
              <MobileLink
                to="/admin/subscription/update"
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Subscription"
                onClick={closeMobile}
              />
              <MobileLink
                to="/admin/subscription/history"
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Subscription History"
                onClick={closeMobile}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
