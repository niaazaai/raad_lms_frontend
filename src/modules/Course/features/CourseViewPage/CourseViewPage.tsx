import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BookStack,
  CheckCircle,
  EditPencil,
  Language,
  Medal,
  NavArrowLeft,
  NavArrowRight,
  Page,
  Play,
  ShoppingBag,
  User,
} from "iconoir-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
} from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { Can, useAuth } from "@/features/auth";
import { cn } from "@/lib/utils";
import {
  getPublicCourseDetailFromResponse,
  getPreviewPlaybackFromResponse,
  usePublicCourseDetail,
  usePublicCoursePreviewPlayback,
} from "@/hooks/usePublicCourses";
import type { PublicSubscriptionPlan } from "@/hooks/usePublicCourses";
import LessonVideoPlayer from "./LessonVideoPlayer";

function formatMoney(amount: string | null | undefined): string {
  if (amount == null || String(amount).trim() === "") return "—";
  const n = Number.parseFloat(String(amount));
  if (Number.isNaN(n)) return String(amount);
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

/** API may send strings or numbers (e.g. decimal duration). */
function formatOptionalDisplay(value: unknown): string {
  if (value == null) return "—";
  const s = String(value).trim();
  return s === "" ? "—" : s;
}

function looksLikeHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

const CourseViewPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { courseId } = useParams<{ courseId: string }>();
  const id = courseId ? Number(courseId) : NaN;
  const validId = !Number.isNaN(id) ? id : null;

  const detailQuery = usePublicCourseDetail(validId, { enabled: validId != null });
  const previewQuery = usePublicCoursePreviewPlayback(validId, { enabled: validId != null });

  const payload = useMemo(
    () => getPublicCourseDetailFromResponse(detailQuery.data),
    [detailQuery.data],
  );

  const previewPlayback = useMemo(
    () => getPreviewPlaybackFromResponse(previewQuery.data),
    [previewQuery.data],
  );

  const course = payload;
  const modules = course?.modules ?? [];
  const plans: PublicSubscriptionPlan[] = course?.subscription_plans ?? [];

  const loading = validId == null || detailQuery.isLoading;
  const isError = detailQuery.isError || (!loading && !course);

  const backHref = user ? "/course/courses" : "/explore-courses";
  const backLabel = user ? "Courses" : "Catalog";

  const [plansOpen, setPlansOpen] = useState(false);

  const loginHref = `/login?redirect=${encodeURIComponent(`/course/courses/${validId ?? 0}/view`)}`;

  if (validId == null) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">Invalid course.</p>
        <Button type="button" variant="outline" onClick={() => navigate(backHref)}>
          {backLabel}
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">Course not found or not available.</p>
        <Button type="button" variant="outline" onClick={() => navigate(backHref)}>
          {backLabel}
        </Button>
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

  const flagBadges: { key: string; label: string }[] = [];
  if (course.is_featured) flagBadges.push({ key: "featured", label: "Featured" });
  if (course.is_popular) flagBadges.push({ key: "popular", label: "Popular" });
  if (course.is_new) flagBadges.push({ key: "new", label: "New" });
  if (course.is_best_seller) flagBadges.push({ key: "bestseller", label: "Best seller" });
  if (course.is_free) flagBadges.push({ key: "free", label: "Free" });

  const showPreviewPlayer =
    previewPlayback &&
    previewPlayback.src &&
    previewPlayback.src.length > 0 &&
    previewPlayback.lesson_id != null;

  return (
    <div className="min-h-0 bg-background pb-12">
      <div className="border-b border-border bg-card">
        <div className="relative h-44 w-full overflow-hidden bg-muted sm:h-52 md:h-60 lg:h-64">
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
              decoding="async"
            />
          ) : null}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-background via-background/75 to-transparent",
              !bannerUrl && "from-background via-background",
            )}
          />
          <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 pb-6 pt-5 sm:flex-row sm:items-end sm:justify-between sm:pb-8 sm:pt-6 md:px-6">
            <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
              {thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt=""
                  className="h-24 w-24 shrink-0 rounded-xl border-2 border-background object-cover shadow-lg ring-1 ring-border sm:h-28 sm:w-28 md:h-36 md:w-36"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-primary/10 sm:h-28 sm:w-28 md:h-36 md:w-36">
                  <BookStack className="h-10 w-10 text-primary/60 md:h-14 md:w-14" />
                </div>
              )}
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {flagBadges.map((b) => (
                    <span
                      key={b.key}
                      className="rounded-md border border-border bg-background/95 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm backdrop-blur-sm"
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl lg:text-4xl">
                  {title}
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">{shortDesc || "—"}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground sm:text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <Language className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {language}
                  </span>
                  <span className="text-border" aria-hidden>
                    |
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Medal className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {level}
                  </span>
                  {course.main_category?.title ? (
                    <>
                      <span className="text-border" aria-hidden>
                        |
                      </span>
                      <span>{course.main_category.title}</span>
                    </>
                  ) : null}
                  {course.sub_category?.title ? (
                    <>
                      <span className="text-border" aria-hidden>
                        |
                      </span>
                      <span>{course.sub_category.title}</span>
                    </>
                  ) : null}
                  {course.instructor?.name ? (
                    <>
                      <span className="text-border" aria-hidden>
                        |
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 shrink-0 text-primary" />
                        {course.instructor.name}
                      </span>
                    </>
                  ) : null}
                  {price !== "—" ? (
                    <>
                      <span className="text-border" aria-hidden>
                        |
                      </span>
                      <span className="font-medium text-foreground">{formatMoney(price)}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => navigate(backHref)}
              >
                <NavArrowLeft className="h-4 w-4" />
                {backLabel}
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

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
          <div className="min-w-0 space-y-10">
            {previewQuery.isLoading ? (
              <div className="flex justify-center py-10">
                <Spinner className="h-8 w-8 text-primary" />
              </div>
            ) : showPreviewPlayer ? (
              <section className="space-y-3 rounded-xl border border-border bg-card/50 p-4 shadow-sm sm:p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Play className="h-5 w-5 shrink-0 text-primary" />
                  Course preview
                </h2>
                <p className="text-sm text-muted-foreground">
                  Introductory clip. Full lessons unlock after you enroll.
                </p>
                <LessonVideoPlayer
                  src={previewPlayback.src}
                  playbackType={previewPlayback.type === "hls" ? "hls" : "progressive"}
                  className="w-full max-w-full"
                />
              </section>
            ) : null}

            {longDesc ? (
              <section className="space-y-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Page className="h-5 w-5 shrink-0 text-primary" />
                  About this course
                </h2>
                {looksLikeHtml(longDesc) ? (
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
              <section className="space-y-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <CheckCircle className="h-5 w-5 shrink-0 text-primary" />
                  Prerequisites
                </h2>
                {looksLikeHtml(prerequisites) ? (
                  <div
                    className="prose-custom max-w-none text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: prerequisites }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{prerequisites}</p>
                )}
              </section>
            ) : null}

            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <BookStack className="h-5 w-5 shrink-0 text-primary" />
                Course content
              </h2>
              <p className="text-sm text-muted-foreground">
                {modules.length} module{modules.length === 1 ? "" : "s"}
              </p>
              {modules.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No modules published yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {modules.map((mod) => (
                    <li
                      key={mod.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <NavArrowRight className="h-4 w-4" />
                      </span>
                      <span className="font-medium text-foreground">{String(mod.title ?? "Module")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
            <Card className="border-primary/25 shadow-md ring-1 ring-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Enroll
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline justify-between gap-2 border-b border-border pb-3">
                  <span className="text-sm text-muted-foreground">
                    {course.is_free ? "Price" : "From"}
                  </span>
                  <span
                    className={`text-2xl font-bold tabular-nums ${course.is_free ? "text-primary" : "text-foreground"}`}
                  >
                    {course.is_free ? "Free" : formatMoney(price)}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Pick a plan, then sign in to continue enrollment with your institution.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    className="w-full gap-2"
                    onClick={() => setPlansOpen(true)}
                    disabled={plans.length === 0 && !course.is_free}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {plans.length > 0 ? "Buy now — view plans" : "Plans unavailable"}
                  </Button>
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <Link to={loginHref}>Sign in to continue</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Page className="h-4 w-4 text-primary" />
                Details
              </h3>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Language className="h-3.5 w-3.5 shrink-0" />
                    Language
                  </dt>
                  <dd className="text-right font-medium text-foreground">{language}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Medal className="h-3.5 w-3.5 shrink-0" />
                    Level
                  </dt>
                  <dd className="text-right font-medium text-foreground">{level}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Duration</dt>
                  <dd className="text-right font-medium text-foreground">
                    {formatOptionalDisplay(course.estimated_duration)}
                  </dd>
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

      <Drawer open={plansOpen} onClose={() => setPlansOpen(false)}>
        <DrawerOverlay />
        <DrawerContent className="max-w-lg">
          <DrawerHeader>
            <DrawerTitle>Subscription plans</DrawerTitle>
            <DrawerDescription>
              Plans linked to this course. Contact your administrator or sign in to proceed with
              enrollment.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            {plans.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No subscription plans are configured for this course yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {plans.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-lg border border-border bg-muted/20 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{p.plan_name}</p>
                        {p.plan_description ? (
                          <p className="mt-1 text-sm text-muted-foreground">{p.plan_description}</p>
                        ) : null}
                        <p className="mt-2 text-xs text-muted-foreground">
                          {p.duration_in_days} days · {p.subscription_type}
                        </p>
                      </div>
                      <p className="text-lg font-bold tabular-nums text-primary">
                        {formatMoney(String(p.price))}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DrawerBody>
          <DrawerFooter>
            <Button type="button" variant="outline" onClick={() => setPlansOpen(false)}>
              Close
            </Button>
            <Button type="button" asChild>
              <Link to={loginHref}>Sign in to enroll</Link>
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default CourseViewPage;
