import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-lg border border-border bg-surface", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center gap-2 px-5 pt-5 pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("flex items-center gap-2 text-sm font-semibold [&_svg]:size-4 [&_svg]:text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

/** Section separated by a hairline rule instead of a box. */
export function Section({ title, icon: Icon, className, children }: { title: string; icon?: React.ComponentType<{ className?: string }>; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("border-t border-border pt-4", className)}>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {Icon && <Icon aria-hidden className="size-4 text-muted" />}
        {title}
      </h2>
      {children}
    </section>
  );
}
