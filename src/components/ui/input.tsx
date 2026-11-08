import { cn } from "@/lib/utils";

const field =
  "h-12 w-full rounded-xl border border-border bg-surface px-3 text-sm transition-colors placeholder:text-muted focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/20 focus-visible:outline-none";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(field, className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(field, "appearance-auto", className)} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("grid gap-1.5 text-sm font-medium", className)} {...props} />;
}
