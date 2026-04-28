import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EditPencil, NavArrowLeft, Play } from "iconoir-react";
import { Button, Spinner } from "@/components/ui";
import { Can } from "@/features/auth";
import { cn } from "@/lib/utils";
import {
  getCourseEntityDetailFromResponse,
  getCourseListFromResponse,
  useCourseEntityDetail,
  useCourseEntityList,
  type CourseRow,
} from "../../hooks/useCourseEntity";

const CourseViewPage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const id = courseId ? Number(courseId) : NaN;
  const validId = !Number.isNaN(id) ? id : null;

  const detailQuery = useCourseEntityDetail("courses", validId, { enabled: validId != null });
  const modulesQuery = useCourseEntityList(
    validId != null ? "course-faasls" : null,
    validId != null ? { course_id: validId, per_page: 200 } : undefined,
    { enabled: validId != null }
  );
  const lessonsQuery = useCourseEntityList(
    validId != null ? "lessons" : null,
    validId != null ? { course_id: validId, per_page: 500 } : undefined,
    { enabled: validId != null }
  );

  const course = getCourseEntityDetailFromResponse(detailQuery.data);
  const modules = useMemo(
    () => getCourseListFromResponse(modulesQuery.data),
    [modulesQuery.data]
  );
  const lessons = useMemo(
    () => getCourseListFromResponse(lessonsQuery.data),
    [lessonsQuery.data]
  );

  const loading =
    validId == null ||
    detailQuery.isLoading ||
    modulesQuery.isLoading ||
    lessonsQuery.isLoading;

  if (validId == null) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">Invalid course.</p>
        <Button type="button" variant="outline" onClick={() => navigate("/course/courses")}>
          Back to courses
        </Button>
      </div>
    );
  }

  if (loading || !course) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    );
  }

  const title = String(course.title ?? "Course");
  const shortDesc = String(course.short_description ?? "").trim();
  const longDesc = String(course.long_description ?? "").trim();
  const prerequisites = String(course.prerequisites ?? "").trim();
  const bannerUrl =
    typeof course.banner_url === "string" && course.banner_url ? course.banner_url : null;
  const thumbUrl =
    typeof course.thumbnail_url === "string" && course.thumbnail_url ? course.thumbnail_url : null;
  const language = String(course.language ?? "—");
  const level = String(course.level ?? "—");
  const price = course.price != null ? String(course.price) : "—";

  const lessonsByModule = (mid: number) =>
    lessons.filter((row) => Number(row.course_module_id) === mid);

  const flagBadges: { key: string; label: string }[] = [];
  if (course.is_featured) flagBadges.push({ key: "featured", label: "Featured" });
  if (course.is_popular) flagBadges.push({ key: "popular", label: "Popular" });
  if (course.is_new) flagBadges.push({ key: "new", label: "New" });
  if (course.is_best_seller) flagBadges.push({ key: "bestseller", label: "Best seller" });
  if (course.is_free) flagBadges.push({ key: "free", label: "Free" });

  return (
    <div className="min-h-0 pb-10">
      <div className="border-b border-border bg-card">
        <div
          className={cn(
            "relative h-44 w-full overflow-hidden bg-muted md:h-56",
            bannerUrl && "bg-center bg-cover"
          )}
          style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}
        >
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent",
              !bannerUrl && "from-background via-background"
            )}
          />
          <div className="relative mx-auto flex max-w-5xl flex-col gap-3 px-4 pb-6 pt-4 md:flex-row md:items-end md:justify-between md:px-6">
            <div className="flex min-w-0 flex-1 gap-4">
              {thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt=""
                  className="hidden h-28 w-28 shrink-0 rounded-lg border border-border object-cover shadow-sm sm:block md:h-32 md:w-32"
                />
              ) : (
                <div className="hidden h-28 w-28 shrink-0 rounded-lg border border-border bg-primary/10 sm:flex md:h-32 md:w-32" />
              )}
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {flagBadges.map((b) => (
                    <span
                      key={b.key}
                      className="rounded-md border border-border bg-background/80 px-2 py-0.5 text-[11px] font-medium text-foreground backdrop-blur-sm"
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  {title}
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  {shortDesc || "No short description."}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {language} · {level}
                  {price !== "—" ? ` · ${price}` : null}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => navigate("/course/courses")}
              >
                <NavArrowLeft className="h-4 w-4" />
                Courses
              </Button>
              <Can permission="course.courses.update">
                <Button
                  type="button"
                  size="sm"
                  className="gap-2"
                  onClick={() => navigate(`/course/courses/${validId}/edit`)}
                >
                  <EditPencil className="h-4 w-4" />
                  Edit
                </Button>
              </Can>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-[minmax(0,1fr)_320px] md:px-6">
        <div className="min-w-0 space-y-8">
          {longDesc ? (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">About this course</h2>
              {longDesc.includes("<") ? (
                <div
                  className="prose-custom max-w-none text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: longDesc }}
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{longDesc}</p>
              )}
            </section>
          ) : null}
          {prerequisites ? (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Prerequisites</h2>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{prerequisites}</p>
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Course content</h2>
            <p className="text-sm text-muted-foreground">
              {modules.length} module{modules.length === 1 ? "" : "s"} · {lessons.length} lesson
              {lessons.length === 1 ? "" : "s"}
            </p>
            <div className="space-y-3">
              {modules.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No curriculum published yet.
                </p>
              ) : (
                modules.map((mod) => {
                  const mid = Number(mod.id);
                  const modLessons = lessonsByModule(mid);
                  return (
                    <div
                      key={mid}
                      className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
                    >
                      <div className="border-b border-border bg-muted/30 px-4 py-3">
                        <h3 className="font-semibold text-foreground">
                          {String(mod.title ?? "Module")}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {modLessons.length} lesson{modLessons.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <ul className="divide-y divide-border">
                        {modLessons.length === 0 ? (
                          <li className="px-4 py-3 text-sm text-muted-foreground">
                            No lessons in this module.
                          </li>
                        ) : (
                          modLessons.map((lesson) => {
                            const row = lesson as CourseRow;
                            const hasVideo =
                              typeof row.primary_video_url === "string" &&
                              row.primary_video_url.length > 0;
                            return (
                              <li
                                key={Number(row.id)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm"
                              >
                                <Play
                                  className={cn(
                                    "h-4 w-4 shrink-0",
                                    hasVideo ? "text-primary" : "text-muted-foreground/50"
                                  )}
                                />
                                <span className="min-w-0 flex-1 font-medium text-foreground">
                                  {String(row.title ?? "Lesson")}
                                </span>
                              </li>
                            );
                          })
                        )}
                      </ul>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4 md:sticky md:top-4 md:self-start">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Course details</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Language</dt>
                <dd className="text-right font-medium text-foreground">{language}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Level</dt>
                <dd className="text-right font-medium text-foreground">{level}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Price</dt>
                <dd className="text-right font-medium text-foreground">{price}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="text-right font-medium text-foreground">
                  {String(course.status ?? "—")}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CourseViewPage;
