/**
 * Unified Sonner toasts — icon + title + subtitle for every user-facing action.
 * Bottom-right position configured in providers.tsx.
 */
import { toast } from "sonner";
import {
  BookOpen,
  BookPlus,
  CheckCircle2,
  CloudOff,
  HandMetal,
  LogIn,
  Pencil,
  RefreshCw,
  Sparkles,
  Trash2,
  UserPlus,
  Wifi,
  AlertCircle,
  Info,
} from "lucide-react";
import type { AppToastPayload } from "@/types/toast";

function show(payload: AppToastPayload): void {
  const Icon = payload.icon;
  const fn =
    payload.variant === "error"
      ? toast.error
      : payload.variant === "warning"
        ? toast.warning
        : payload.variant === "info"
          ? toast.info
          : toast.success;

  fn(payload.title, {
    description: payload.description,
    duration: payload.duration ?? 4000,
    icon: Icon ? <Icon className="h-4 w-4 shrink-0" /> : undefined,
  });
}

function showError(title: string, description?: string): void {
  show({ title, description, icon: AlertCircle, variant: "error" });
}

function showInfo(title: string, description?: string, duration?: number): void {
  show({ title, description, icon: Info, variant: "info", duration });
}

export const appToast = {
  auth: {
    welcomeBack(displayName: string) {
      show({
        title: `Welcome back, ${displayName}`,
        description: "Enjoy writing the stories of your life.",
        icon: LogIn,
        variant: "success",
        duration: 5000,
      });
    },
    goodbye(displayName: string) {
      show({
        title: `Bye for now, ${displayName}`,
        description: "Hope to see you soon.",
        icon: HandMetal,
        variant: "info",
        duration: 4500,
      });
    },
    registered(displayName: string) {
      show({
        title: `Welcome, ${displayName}`,
        description: "Your journal is ready — start your first story.",
        icon: UserPlus,
        variant: "success",
        duration: 5000,
      });
    },
    googleError() {
      showError("Could not open Google sign-in", "Please try again.");
    },
  },

  journal: {
    entrySaved() {
      show({ title: "Entry saved", description: "Your words are safe on the page.", icon: CheckCircle2 });
    },
    entryRemoved() {
      show({ title: "Page removed", description: "That entry has been deleted.", icon: Trash2 });
    },
    bookCreated() {
      show({ title: "Journal created", description: "A new book awaits your stories.", icon: BookPlus });
    },
    bookUpdated() {
      show({ title: "Journal updated", description: "Cover and details saved.", icon: Pencil });
    },
    bookRemoved() {
      show({ title: "Journal removed", description: "The book and its pages are gone.", icon: Trash2 });
    },
    autosaved() {
      show({
        title: "Saved",
        description: "Your draft is up to date.",
        icon: CheckCircle2,
        duration: 2000,
      });
    },
    newPageCreated() {
      show({ title: "New page added", description: "Turn the page and start writing.", icon: BookOpen });
    },
    draftRestored() {
      showInfo("Restored unsaved draft", "Picked up where you left off.", 2500);
    },
    saveFailed(action = "save") {
      showError(`Failed to ${action}`, "Please try again in a moment.");
    },
  },

  offline: {
    queued(entity = "Changes") {
      showInfo(
        `${entity} saved offline`,
        "Will sync automatically when you're back online.",
        3500,
      );
    },
    syncFailed(message?: string) {
      showError("Could not sync offline change", message ?? "Please retry when online.");
    },
    conflictDiscarded() {
      showError("Offline change discarded", "Server had a newer version.");
    },
    syncComplete(count: number) {
      show({
        title: "Back online",
        description:
          count === 1 ? "1 offline change synced." : `${count} offline changes synced.`,
        icon: Wifi,
        variant: "success",
      });
    },
    badgeHint() {
      showInfo("Working offline", "Changes queue until connection returns.", 2500);
    },
  },

  ai: {
    rateLimited(retrySec: number) {
      showError("AI assist paused", `Try again in ${retrySec} seconds.`);
    },
    unavailable() {
      showError("AI assist unavailable", "Please try again later.");
    },
    fallbackOpenRouter() {
      showInfo("Using backup AI provider", "Groq busy — OpenRouter is helping out.", 3000);
    },
    thinking() {
      showInfo("Writing…", "AI is continuing your entry.", 2000);
    },
  },

  sync: {
    refreshed() {
      show({
        title: "Journal updated",
        description: "Synced from another tab or device.",
        icon: RefreshCw,
        duration: 2500,
      });
    },
  },

  generic: {
    success(title: string, description?: string) {
      show({ title, description, icon: CheckCircle2, variant: "success" });
    },
    error(title: string, description?: string) {
      showError(title, description);
    },
    info(title: string, description?: string) {
      showInfo(title, description);
    },
    offline() {
      show({ title: "You're offline", description: "Edits will sync later.", icon: CloudOff, variant: "warning" });
    },
  },
};
