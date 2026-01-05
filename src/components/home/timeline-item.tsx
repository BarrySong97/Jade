import { Badge, Card, CardContent } from "@songzi/ui";

export interface Experience {
  company: string;
  role: string;
  period: string; // e.g., "Jan 2023 - Present"
  description: string;
  type?: "current" | "past";
}

export interface TimelineItemProps {
  experience: Experience;
  isLast?: boolean; // Hides timeline line for last item
}

export function TimelineItem({ experience, isLast }: TimelineItemProps) {
  const { company, role, period, description } = experience;

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{period}</p>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{company}</h3>
        <p className="text-sm text-muted-foreground">{role}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
