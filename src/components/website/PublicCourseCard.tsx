import { Button } from "@/components/ui";
import ReflectiveCard from "@/components/website/ReflectiveCard";
import { BookStack } from "iconoir-react";
import { Link } from "react-router-dom";
import type { PublicCourseListItem } from "@/hooks/usePublicCourses";

interface PublicCourseCardProps {
  course: PublicCourseListItem;
  enrollHref: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

/** Compact duration, e.g. `18 hr` (floored hours). */
function formatEstimatedHours(raw: string | number | null | undefined): string | null {
  if (raw == null || !String(raw).trim()) return null;
  const t = String(raw).trim();
  const lower = t.toLowerCase();

  const fromWords = lower.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr)\b/);
  if (fromWords) {
    return `${Math.floor(parseFloat(fromWords[1]))} hr`;
  }

  if (/^\d+(\.\d+)?$/.test(t)) {
    return `${Math.floor(parseFloat(t))} hr`;
  }

  const hms = /^(\d+):(\d{2})(?::(\d{2}))?/.exec(t);
  if (hms) {
    const h = parseInt(hms[1], 10);
    const m = parseInt(hms[2], 10);
    const total = h + m / 60;
    return `${Math.floor(total)} hr`;
  }

  const digits = t.match(/(\d+(?:\.\d+)?)/);
  if (digits) {
    return `${Math.floor(parseFloat(digits[1]))} hr`;
  }

  return t;
}

function formatPrice(course: PublicCourseListItem): string {
  if (course.is_free) return "Free";
  if (course.price != null && String(course.price).trim() !== "") {
    const n = Number(course.price);
    if (!Number.isNaN(n)) return `$${n.toFixed(2)}`;
    return String(course.price);
  }
  return "—";
}

const PublicCourseCard = ({ course, enrollHref }: PublicCourseCardProps) => {
  const subtitle = course.short_description ? stripHtml(course.short_description) : "";
  const title = course.title || "Course";
  const durationLabel = formatEstimatedHours(course.estimated_duration);

  return (
    <ReflectiveCard
      imageSrc={course.thumbnail_url}
      imageAlt={title}
      placeholder={<BookStack className="h-14 w-14 opacity-50" />}
      blurStrength={8}
      metalness={0.85}
      roughness={0.35}
      displacementStrength={18}
      noiseScale={1.2}
      specularConstant={1.6}
      grayscale={0.25}
      glassDistortion={10}
      color="#071437"
      overlayColor="rgba(252, 253, 255, 0.96)"
      className="h-full transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex flex-1 flex-col gap-4 p-5 pt-5 md:p-6">
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-foreground md:text-xl">
            {title}
          </h3>
          {subtitle ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">{subtitle}</p>
          ) : (
            <p className="text-sm italic text-muted-foreground/80">Explore the full curriculum after signing in.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {course.level ? (
            <span className="rounded-full border border-border bg-primary/5 px-2.5 py-1 font-medium text-primary">
              {course.level}
            </span>
          ) : null}
          {course.language ? (
            <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 font-medium">{course.language}</span>
          ) : null}
          {durationLabel ? (
              <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 font-medium text-foreground">
                {durationLabel}
              </span>
            ) : null}
        </div>

        <div className="mt-auto flex flex-col gap-4 border-t border-border pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</span>
            <span
              className={`text-xl font-bold tabular-nums ${course.is_free ? "text-primary" : "text-foreground"}`}
            >
              {formatPrice(course)}
            </span>
          </div>

          <Button
            asChild
            className="h-12 w-full rounded-full px-6 text-base font-semibold shadow-md hover:shadow-lg"
          >
            <Link to={enrollHref} className="inline-flex w-full items-center justify-center">
              View
            </Link>
          </Button>
        </div>
      </div>
    </ReflectiveCard>
  );
};

export default PublicCourseCard;
