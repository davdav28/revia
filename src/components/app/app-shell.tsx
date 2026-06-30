"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { NAV_ITEMS, SECONDARY_NAV, type NavItem } from "./nav";
import { SalonSwitcher } from "./salon-switcher";
import { logoutAction } from "@/app/(auth)/actions";
import type { AccessibleSalon } from "@/lib/auth";

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-nude-soft text-ink"
          : "text-muted hover:bg-nude-soft/60 hover:text-ink",
      )}
    >
      <item.icon
        className={cn(
          "size-[1.15rem] shrink-0",
          active ? "text-lacquer-ink" : "text-muted",
        )}
      />
      {item.label}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-2">
        <Logo className="text-xl" />
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
      <nav className="border-line flex flex-col gap-1 border-t pt-3">
        {SECONDARY_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </div>
  );
}

export function AppShell({
  salons,
  activeSalonId,
  canAddSalon,
  userLabel,
  children,
}: {
  salons: AccessibleSalon[];
  activeSalonId: string;
  canAddSalon: boolean;
  userLabel: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="bg-base flex min-h-dvh">
      {/* Sidebar fixe (desktop) */}
      <aside className="border-line bg-surface hidden w-64 shrink-0 border-r lg:block">
        <div className="sticky top-0 h-dvh">
          <SidebarContent />
        </div>
      </aside>

      {/* Drawer (mobile) */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Fermer le menu"
            className="bg-ink/40 absolute inset-0"
            onClick={() => setMobileOpen(false)}
          />
          <div className="border-line bg-surface absolute inset-y-0 left-0 w-64 border-r">
            <button
              aria-label="Fermer le menu"
              className="text-muted hover:text-ink absolute top-4 right-4 rounded-md p-1"
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      {/* Colonne principale */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-line bg-base/90 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur sm:px-6">
          <button
            aria-label="Ouvrir le menu"
            className="text-muted hover:bg-nude-soft hover:text-ink rounded-md p-1.5 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </button>

          <div className="min-w-0 flex-1">
            <SalonSwitcher
              salons={salons}
              activeSalonId={activeSalonId}
              canAddSalon={canAddSalon}
            />
          </div>

          <span className="text-muted hidden text-sm sm:inline">
            {userLabel}
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-muted hover:bg-nude-soft hover:text-ink flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </form>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
