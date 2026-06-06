import type { LucideIcon } from "lucide-react";

/** Sonner toast payload — title + optional subtitle (description). */
export type AppToastPayload = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  variant?: "success" | "error" | "info" | "warning";
  duration?: number;
};
