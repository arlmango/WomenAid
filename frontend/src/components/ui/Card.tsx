import { type HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Variant = "med" | "fem" | "glass";
type FemTone = "indigo" | "sunset";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  /** Gradient direction for the `fem` variant: blue→purple or pink→orange. */
  tone?: FemTone;
  /** Adds a subtle hover lift — only for cards that are themselves links/buttons. */
  interactive?: boolean;
}

const FEM_TONES: Record<FemTone, string> = {
  indigo: "bg-gradient-to-br from-indigo to-violet",
  sunset: "bg-gradient-to-br from-pink to-gold",
};

// `med` — strict MedTech: white surface, thin deep-blue outline, near-sharp
// corners. For clinical/legal content (consent, triage data, disclaimers).
// `fem` — soft FemTech: vibrant gradient, white text, generous radius. For
// reassuring patient-facing moments (next screening, wellbeing).
// `glass` — frosted overlay, only over the aurora backdrop (auth/patient hero).
export function Card({
  variant = "med",
  tone = "indigo",
  interactive = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        variant === "med" && "rounded-md border border-navy bg-surface shadow-soft",
        variant === "fem" && cn("rounded-3xl text-white shadow-soft", FEM_TONES[tone]),
        variant === "glass" && "glass-card rounded-card",
        interactive && "transition-all hover:-translate-y-0.5 hover:shadow-soft-hover",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-5 pb-0", className)} {...props} />;
}

// Color is inherited: deep-indigo ink on `med`, white on `fem`.
export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("font-display text-lg font-extrabold", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm opacity-80", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-2 p-5 pt-0", className)} {...props} />;
}
