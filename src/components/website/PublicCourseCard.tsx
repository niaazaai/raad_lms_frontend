import { Button } from "@/components/ui";
import ReflectiveCard from "@/components/website/ReflectiveCard";
import { BookStack, NavArrowRight } from "iconoir-react";
import type { PublicCourseListItem } from "@/hooks/usePublicCourses";

interface PublicCourseCardProps {
  course: PublicCourseListItem;
  enrollHref: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
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
      className="h-full transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(0,105,180,0.18)]"
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
            <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 font-medium text-primary">
              {course.level}
            </span>
          ) : null}
          {course.language ? (
            <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 font-medium">{course.language}</span>
          ) : null}
          {course.estimated_duration ? (
            <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 font-medium">
              {course.estimated_duration}
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex flex-col gap-4 border-t border-border/60 pt-4">
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
            <a href={enrollHref} className="inline-flex w-full items-center justify-center gap-2">
              <span>View</span>
              <NavArrowRight className="h-5 w-5 shrink-0" />
            </a>
          </Button>
        </div>
      </div>
    </ReflectiveCard>
  );
};

export default PublicCourseCard;
