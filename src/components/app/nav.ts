import {
  LayoutDashboard,
  Users,
  Calendar,
  Send,
  Settings,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/** Navigation principale de l'app, nommée par ce que la gérante contrôle. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/clientes", icon: Users },
  { label: "Agenda", href: "/agenda", icon: Calendar },
  { label: "Relances", href: "/relances", icon: Send },
  { label: "Réglages", href: "/reglages", icon: Settings },
];

/** Liens secondaires (bas de la sidebar). */
export const SECONDARY_NAV: NavItem[] = [
  { label: "Aide & suggestions", href: "/aide", icon: HelpCircle },
];
