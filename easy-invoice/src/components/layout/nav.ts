import {
  LayoutDashboard,
  Users,
  FileText,
  FileSignature,
  Package,
  Wallet,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/quotes", label: "Quotes", icon: FileSignature },
  { to: "/products", label: "Products & Services", icon: Package },
  { to: "/payments", label: "Payments", icon: Wallet },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Business Settings", icon: Settings },
];
