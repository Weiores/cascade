import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type LabelHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "../lib/utils";

// ---------- Button ----------
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-ink text-paper hover:bg-ink/85 active:scale-[0.98]": variant === "default",
          "border border-ink/20 bg-transparent text-ink hover:border-ink hover:bg-ink/5": variant === "outline",
          "text-ink/70 hover:bg-ink/5 hover:text-ink": variant === "ghost",
          "bg-line-red text-white hover:bg-line-red/90": variant === "destructive",
        },
        {
          "h-8 px-3 text-xs": size === "sm",
          "h-10 px-5 text-sm": size === "md",
          "h-12 px-7 text-base": size === "lg",
        },
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

// ---------- Card ----------
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink/10 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-5 pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-semibold tracking-tight text-ink", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-2", className)} {...props} />;
}

// ---------- Badge ----------
type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  color?: string;
};

export function Badge({ className, color, style, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        className
      )}
      style={
        color
          ? { color, borderColor: `${color}55`, backgroundColor: `${color}12`, ...style }
          : style
      }
      {...props}
    />
  );
}

// ---------- Input ----------
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border border-ink/15 bg-white px-3 text-sm text-ink placeholder:text-ink/35 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

// ---------- Select ----------
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full appearance-none rounded-xl border border-ink/15 bg-white px-3 text-sm text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink",
        className
      )}
      {...props}
    />
  )
);
Select.displayName = "Select";

// ---------- Label ----------
export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-xs font-semibold uppercase tracking-wider text-ink/60", className)}
      {...props}
    />
  );
}
