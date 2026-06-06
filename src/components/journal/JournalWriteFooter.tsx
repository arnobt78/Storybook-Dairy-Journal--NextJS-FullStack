"use client";

/**
 * Write-mode footer — word count, AI assist, cancel, save.
 * Responsive flex-wrap row; high-contrast AI button for cream paper background.
 */
import { AlignLeft, Check, Sparkles, X } from "lucide-react";
import { RippleButton } from "@/components/ui/ripple-button";

type JournalWriteFooterProps = {
  wordCount: number;
  isAiThinking: boolean;
  isSaving: boolean;
  canAiAssist: boolean;
  onAiAssist: () => void;
  onCancel: () => void;
  onSave: () => void;
};

export function JournalWriteFooter({
  wordCount,
  isAiThinking,
  isSaving,
  canAiAssist,
  onAiAssist,
  onCancel,
  onSave,
}: JournalWriteFooterProps) {
  return (
    <div className="journal-write-footer">
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontFamily: "'Lora',serif",
          fontSize: "10px",
          color: "rgba(100,55,20,.45)",
          flexShrink: 0,
        }}
      >
        <AlignLeft size={13} strokeWidth={2} aria-hidden />
        {wordCount} words
      </span>

      <div className="journal-write-footer__actions">
        <RippleButton
          type="button"
          icon={Sparkles}
          iconSize={13}
          onClick={onAiAssist}
          disabled={isAiThinking || !canAiAssist}
          style={{
            fontFamily: "'Lora',serif",
            fontSize: "9px",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            background: "rgba(55,28,100,.42)",
            color: "rgba(245,235,255,.95)",
            border: "1px solid rgba(120,80,200,.35)",
            padding: "5px 12px",
            borderRadius: "4px",
            cursor: "pointer",
            flexShrink: 0,
            opacity: isAiThinking || !canAiAssist ? 0.4 : 1,
          }}
        >
          AI Assist
        </RippleButton>
        <RippleButton
          type="button"
          icon={X}
          iconSize={13}
          onClick={onCancel}
          style={{
            fontFamily: "'Lora',serif",
            fontSize: "9.5px",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            background: "transparent",
            color: "rgba(100,55,20,.55)",
            border: "1px solid rgba(120,70,20,.22)",
            padding: "5px 12px",
            borderRadius: "4px",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Cancel
        </RippleButton>
        <RippleButton
          type="button"
          icon={Check}
          iconSize={13}
          onClick={onSave}
          disabled={isSaving}
          shine
          shineRadius={4}
          style={{
            fontFamily: "'Lora',serif",
            fontSize: "9.5px",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            background: "rgba(90,40,10,.82)",
            color: "rgba(255,215,150,.92)",
            border: "none",
            padding: "5px 14px",
            borderRadius: "4px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,.3)",
            flexShrink: 0,
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          {isSaving ? "Saving…" : "Save"}
        </RippleButton>
      </div>
    </div>
  );
}
