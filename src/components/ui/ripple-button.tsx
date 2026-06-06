"use client";

/**
 * RippleButton — water-splash click effect per docs/RIPPLE_BUTTON_EFFECT.md.
 * Optional Lucide icon + configurable shine radius (fixes pill-stretch on inline CTAs).
 */
import {
  forwardRef,
  useCallback,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type MouseEvent,
} from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type RippleButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Wrap in cta-shine-wrap for auto-playing shine sweep on primary CTAs */
  shine?: boolean;
  /** Border radius applied to shine wrap + button (default 4px — avoids pill stretch) */
  shineRadius?: string | number;
  /** Optional Lucide icon rendered before/after label */
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  iconSize?: number;
};

function toRadius(value: string | number | undefined): string {
  if (value === undefined) return "4px";
  return typeof value === "number" ? `${value}px` : value;
}

export const RippleButton = forwardRef<HTMLButtonElement, RippleButtonProps>(
  function RippleButton(
    {
      className,
      style,
      onClick,
      children,
      shine = false,
      shineRadius,
      icon: Icon,
      iconPosition = "left",
      iconSize = 16,
      type = "button",
      ...props
    },
    ref,
  ) {
    const handleClick = useCallback(
      (e: MouseEvent<HTMLButtonElement>) => {
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const ripple = document.createElement("span");
        ripple.className = "ripple-effect";
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        btn.appendChild(ripple);
        ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
        onClick?.(e);
      },
      [onClick],
    );

    const radius = toRadius(shineRadius ?? (style?.borderRadius as string | number | undefined));
    const isFullWidth = className?.includes("w-full") || style?.width === "100%";

    const buttonStyle: CSSProperties = {
      position: "relative",
      overflow: "hidden",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: Icon ? "8px" : undefined,
      flexShrink: 0,
      borderRadius: radius,
      ...style,
    };

    const button = (
      <button
        ref={ref}
        type={type}
        className={cn("relative overflow-hidden", shine && "cta-shine-button", className)}
        style={buttonStyle}
        onClick={handleClick}
        {...props}
      >
        {Icon && iconPosition === "left" && (
          <Icon size={iconSize} strokeWidth={2} aria-hidden className="shrink-0" />
        )}
        {children}
        {Icon && iconPosition === "right" && (
          <Icon size={iconSize} strokeWidth={2} aria-hidden className="shrink-0" />
        )}
      </button>
    );

    if (shine) {
      const wrapStyle: CSSProperties = {
        position: "relative",
        display: isFullWidth ? "block" : "inline-flex",
        width: isFullWidth ? "100%" : "fit-content",
        overflow: "hidden",
        borderRadius: radius,
        flexShrink: 0,
      };
      return (
        <span className="cta-shine-wrap" style={wrapStyle}>
          {button}
        </span>
      );
    }

    return button;
  },
);
