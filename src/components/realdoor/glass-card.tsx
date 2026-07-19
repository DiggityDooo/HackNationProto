import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PaperCard({
  children,
  className,
  as: Tag = "section",
  raised = false,
}: {
  children: ReactNode;
  className?: string;
  as?: React.ElementType<{ className?: string; children?: ReactNode }>;
  raised?: boolean;
}) {
  return (
    <Tag className={cn(raised ? "paper-card-raised" : "paper-card", className)}>
      {children}
    </Tag>
  );
}

// Backwards-compat alias for prior GlassCard imports.
export const GlassCard = PaperCard;
