"use client";

/**
 * Read-mode footer — mood, weather, word count, remove page, edit.
 * Responsive flex-wrap; Lucide icons on destructive and edit actions.
 */
import { AlignLeft, PencilLine, Trash2 } from "lucide-react";
import type { JournalEntry } from "@/types";
import { RippleButton } from "@/components/ui/ripple-button";

type JournalReadFooterProps = {
  entry: JournalEntry;
  onStartWriting: () => void;
  onDeleteEntry?: () => void;
  canDeleteEntry?: boolean;
};

export function JournalReadFooter({
  entry,
  onStartWriting,
  onDeleteEntry,
  canDeleteEntry = true,
}: JournalReadFooterProps) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "8px",
        paddingTop: "10px",
        marginTop: "8px",
        borderTop: "1px solid rgba(120,70,20,.1)",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: "15px", flexShrink: 0 }}>{entry.mood}</span>
      <span style={{ fontSize: "15px", flexShrink: 0 }}>{entry.weather}</span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontFamily: "'Lora',serif",
          fontSize: "10px",
          color: "rgba(100,55,20,.38)",
          marginRight: "auto",
          flexShrink: 0,
        }}
      >
        <AlignLeft size={13} strokeWidth={2} aria-hidden />
        {entry.wordCount} words
      </span>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "6px",
          marginLeft: "auto",
        }}
      >
        {onDeleteEntry && canDeleteEntry && (
          <RippleButton
            type="button"
            icon={Trash2}
            iconSize={13}
            onClick={onDeleteEntry}
            style={{
              fontFamily: "'Lora',serif",
              fontSize: "9px",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              background: "transparent",
              color: "rgba(140,50,30,.6)",
              border: "1px solid rgba(140,50,30,.25)",
              padding: "4px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Remove page
          </RippleButton>
        )}
        <RippleButton
          type="button"
          icon={PencilLine}
          iconSize={13}
          onClick={onStartWriting}
          style={{
            fontFamily: "'Lora',serif",
            fontSize: "9.5px",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            background: "transparent",
            color: "rgba(100,55,20,.55)",
            border: "1px solid rgba(120,70,20,.2)",
            padding: "4px 11px",
            borderRadius: "4px",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Edit
        </RippleButton>
      </div>
    </div>
  );
}
