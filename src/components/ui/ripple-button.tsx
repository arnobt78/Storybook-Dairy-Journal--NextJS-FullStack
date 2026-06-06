"use client";

/**
 * RippleButton — water-splash click effect per docs/RIPPLE_BUTTON_EFFECT.md.
 * Client-only; ripple spans created on click (no hydration mismatch).
 */
import {
  forwardRef,
  useCallback,
  type ButtonHTMLAttributes,
  type MouseEvent,
} from "react";
import { cn } from "@/lib/utils";

export type RippleButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Wrap in cta-shine-wrap for auto-playing shine sweep on primary CTAs */
  shine?: boolean;
};

export const RippleButton = forwardRef<HTMLButtonElement, RippleButtonProps>(
  function RippleButton(
    { className, style, onClick, children, shine = false, type = "button", ...props },
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

    const button = (
      <button
        ref={ref}
        type={type}
        className={cn("relative overflow-hidden", shine && "cta-shine-button", className)}
        style={{ position: "relative", overflow: "hidden", ...style }}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );

    if (shine) {
      return <span className="cta-shine-wrap inline-block w-full">{button}</span>;
    }

    return button;
  },
);
