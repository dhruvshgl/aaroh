import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  as: Tag = "section",
  id,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  as?: "section" | "article" | "div";
  id?: string;
}) {
  return (
    <Tag id={id} className={cn("surface p-5 sm:p-6", className)}>
      {title || action ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? <h2 className="text-h2">{title}</h2> : null}
            {description ? <p className="mt-1 text-small text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </Tag>
  );
}
