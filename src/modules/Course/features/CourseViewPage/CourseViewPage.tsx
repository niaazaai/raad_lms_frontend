import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  BookStack,
  CheckCircle,
  Clock,
  EditPencil,
  Hashtag,
  InfoCircle,
  Language,
  Medal,
  NavArrowLeft,
  NavArrowRight,
  Page,
  Phone,
  Play,
  ShoppingBag,
  User,
  ViewGrid,
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
  ImageDropzone,
  Label,
} from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { Can, useAuth } from "@/features/auth";
import { cn } from "@/lib/utils";
import { RequestMethod } from "@/data/constants/methods";
import { useMutationApi } from "@/hooks";
import {
  getPublicCourseDetailFromResponse,
  getPreviewPlaybackFromResponse,
  PUBLIC_COURSES_QUERY_KEY,
  usePublicCourseDetail,
  usePublicCoursePreviewPlayback,
} from "@/hooks/usePublicCourses";
import { toast } from "sonner";
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

const EnrollmentSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  national_id: z.string().min(1, "National ID is required"),
  email: z.string().email("Valid email is required"),
});

type EnrollmentData = z.infer<typeof EnrollmentSchema>;

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

  const lowestPlanPrice = useMemo(() => {
    if (plans.length === 0 || course?.is_free) return course?.price ?? "0";
    const prices = plans
      .map((p) => Number(p.price || 0))
      .filter((p) => p > 0);
    return prices.length > 0 ? Math.min(...prices).toString() : (course?.price ?? "0");
  }, [plans, course]);

  const loading = validId == null || detailQuery.isLoading;
  const isError = detailQuery.isError || (!loading && !course);

  const backHref = user ? "/course/courses" : "/explore-courses";
  const isSignedIn = !!user;

  const [plansOpen, setPlansOpen] = useState(false);
  const [authRequiredModalOpen, setAuthRequiredModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const loginHref = `/login?redirect=${encodeURIComponent(`/course/courses/${validId ?? 0}/view`)}`;
  const registerHref = `/register?redirect=${encodeURIComponent(`/course/courses/${validId ?? 0}/view`)}`;

  useEffect(() => {
    if (!authRequiredModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAuthRequiredModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authRequiredModalOpen]);

  // Prefill form with user data if signed in
  const defaultFormValues: Partial<EnrollmentData> = useMemo(() => ({
    first_name: user?.name?.split(" ")[0] || "",
    last_name: user?.name?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
    phone_number: "",
    national_id: "",
  }), [user]);

  const enrollmentForm = useForm<EnrollmentData>({
    resolver: zodResolver(EnrollmentSchema),
    defaultValues: defaultFormValues,
  });

  const createSubscriptionMutation = useMutationApi({
    url: "/student-subscriptions",
    method: RequestMethod.POST,
    hasFiles: true,
    invalidateKeys: [["course", "entity", "student-subscriptions"], [...PUBLIC_COURSES_QUERY_KEY]],
  });

  if (validId == null) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">Invalid course.</p>
        <Button type="button" variant="outline" onClick={() => navigate(backHref)}>
        Courses
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
          Courses
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
        <div className="relative h-52 w-full overflow-hidden bg-muted sm:h-60 md:h-72 lg:h-80">
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
                    {course.is_free ? "Price" : "Starting from"}
                  </span>
                  <span
                    className={`text-2xl font-bold tabular-nums ${course.is_free ? "text-primary" : "text-foreground"}`}
                  >
                    {course.is_free ? "Free" : formatMoney(lowestPlanPrice)}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {user
                    ? "Choose a plan, upload your payment voucher, and submit for review."
                    : "Sign in or create an account to view plans and complete your purchase."}
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    className="w-full gap-2"
                    onClick={() => {
                      if (plans.length === 0 && !course.is_free) return;
                      if (!user) {
                        setAuthRequiredModalOpen(true);
                        return;
                      }
                      setPlansOpen(true);
                    }}
                    disabled={plans.length === 0 && !course.is_free}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {plans.length > 0 ? "View plans" : "Plans unavailable"}
                  </Button>
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <Link to={loginHref}>Sign in to continue</Link>
                  </Button>
                  {!user ? (
                    <Button type="button" variant="ghost" className="w-full text-muted-foreground" asChild>
                      <Link to={registerHref}>New here? Create an account</Link>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Page className="h-4 w-4 text-primary" />
                Details
              </h3>
              <dl className="mt-3 space-y-2.5 text-sm">
                {course.main_category?.title ? (
                  <div className="flex justify-between gap-2">
                    <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <ViewGrid className="h-3.5 w-3.5 shrink-0 text-primary" />
                      Main category
                    </dt>
                    <dd className="text-right font-medium text-foreground">
                      {course.main_category.title}
                    </dd>
                  </div>
                ) : null}
                {course.sub_category?.title ? (
                  <div className="flex justify-between gap-2">
                    <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Hashtag className="h-3.5 w-3.5 shrink-0 text-primary" />
                      Sub category
                    </dt>
                    <dd className="text-right font-medium text-foreground">
                      {course.sub_category.title}
                    </dd>
                  </div>
                ) : null}
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
                  <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
                    Duration
                  </dt>
                  <dd className="text-right font-medium text-foreground">
                    {formatOptionalDisplay(course.estimated_duration)}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>

      {authRequiredModalOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="course-auth-required-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
            aria-label="Close dialog"
            onClick={() => setAuthRequiredModalOpen(false)}
          />
          <Card className="relative z-10 w-full max-w-md border-border shadow-lg">
            <CardHeader className="space-y-3 pb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <InfoCircle className="h-6 w-6" aria-hidden />
              </div>
              <CardTitle id="course-auth-required-title" className="text-lg leading-snug">
                Sign in or sign up to continue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              <p className="text-sm leading-relaxed text-muted-foreground">
                To buy this course you need an account. Please sign in if you already have one, or create
                a new account first. After that you can choose a plan, upload your payment voucher, and
                submit it for review.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setAuthRequiredModalOpen(false)}
                >
                  Not now
                </Button>
                <Button type="button" variant="outline" className="w-full sm:w-auto" asChild>
                  <Link to={registerHref} onClick={() => setAuthRequiredModalOpen(false)}>
                    Sign up
                  </Link>
                </Button>
                <Button type="button" className="w-full sm:w-auto" asChild>
                  <Link to={loginHref} onClick={() => setAuthRequiredModalOpen(false)}>
                    Sign in
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Drawer open={plansOpen} onClose={() => {
        setPlansOpen(false);
        setShowSuccess(false);
        setSelectedPlanId(null);
        setVoucherFile(null);
        enrollmentForm.reset(defaultFormValues);
      }}>
        <DrawerOverlay />
        <DrawerContent className="max-w-[70vw] max-w-6xl min-w-[800px]">
          <DrawerHeader>
            <DrawerTitle>Course Subscription</DrawerTitle>
            <DrawerDescription>
              Complete your enrollment. We will review your voucher and activate access after payment
              verification.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="space-y-6">
            {/* Bank Payment Explanation */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50 p-5">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                <Phone className="h-4 w-4" /> Payment Instructions
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Pay the selected plan amount to:<br />
                <span className="font-mono text-xs block mt-1 bg-white/70 dark:bg-black/30 p-2 rounded">
                  Raad Institute • A/C: 1234567890 • IBAN: AE12 3456 7890 1234 5678
                </span>
                <br />
                Upload the bank voucher (image or PDF) below. Your subscription will be reviewed and activated within 24-48 hours. Support: +971 50 123 4567
              </p>
            </div>

            {!showSuccess ? (
              plans.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No subscription plans are configured for this course yet.
                </p>
              ) : (
                <>
                  <div>
                    <p className="mb-4 text-sm font-medium text-foreground">Select a Subscription Plan</p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {plans.map((p) => {
                        const isSelected = selectedPlanId === p.id;
                        const planPrice = formatMoney(String(p.price));
                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPlanId(isSelected ? null : p.id)}
                            className={cn(
                              "cursor-pointer rounded-2xl border p-6 transition-all hover:shadow-lg hover:-translate-y-0.5",
                              isSelected
                                ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
                                : "border-border hover:border-primary/60 bg-card"
                            )}
                          >
                            <div className="flex justify-between">
                              <div className="flex-1 pr-4">
                                <p className="font-semibold text-xl text-foreground">{p.plan_name}</p>
                                {p.plan_description && (
                                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed pr-2">
                                    {p.plan_description}
                                  </p>
                                )}
                                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="px-2.5 py-0.5 bg-muted rounded-full">
                                    {p.duration_in_days} days
                                  </span>
                                  <span>{p.subscription_type}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-3xl font-bold text-primary tabular-nums tracking-tighter">
                                  {planPrice}
                                </div>
                                {isSelected && (
                                  <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                                    <CheckCircle className="h-3.5 w-3.5" /> Selected
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selectedPlanId && (
                    <div className="space-y-8 border-t border-border pt-8">
                      <div>
                        <p className="mb-4 text-sm font-medium text-foreground flex items-center gap-2">
                          <User className="h-4 w-4" /> Student Information
                          {isSignedIn && <span className="text-xs text-emerald-600 font-normal">(Prefilled from your profile)</span>}
                        </p>
                        <form onSubmit={enrollmentForm.handleSubmit(() => {})} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="first_name">First Name <span className="text-destructive">*</span></Label>
                            <input
                              id="first_name"
                              {...enrollmentForm.register("first_name")}
                              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1"
                              placeholder="First name"
                            />
                            {enrollmentForm.formState.errors.first_name && (
                              <p className="text-xs text-destructive">{enrollmentForm.formState.errors.first_name.message}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="last_name">Last Name <span className="text-destructive">*</span></Label>
                            <input
                              id="last_name"
                              {...enrollmentForm.register("last_name")}
                              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1"
                              placeholder="Last name"
                            />
                            {enrollmentForm.formState.errors.last_name && (
                              <p className="text-xs text-destructive">{enrollmentForm.formState.errors.last_name.message}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="phone_number">Phone Number <span className="text-destructive">*</span></Label>
                            <input
                              id="phone_number"
                              {...enrollmentForm.register("phone_number")}
                              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1"
                              placeholder="+971 50 123 4567"
                            />
                            {enrollmentForm.formState.errors.phone_number && (
                              <p className="text-xs text-destructive">{enrollmentForm.formState.errors.phone_number.message}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="national_id">National ID / Passport <span className="text-destructive">*</span></Label>
                            <input
                              id="national_id"
                              {...enrollmentForm.register("national_id")}
                              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1"
                              placeholder="1234567890"
                            />
                            {enrollmentForm.formState.errors.national_id && (
                              <p className="text-xs text-destructive">{enrollmentForm.formState.errors.national_id.message}</p>
                            )}
                          </div>
                          <div className="md:col-span-2 space-y-1.5">
                            <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                            <input
                              id="email"
                              type="email"
                              {...enrollmentForm.register("email")}
                              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:ring-1"
                              placeholder="your@email.com"
                            />
                            {enrollmentForm.formState.errors.email && (
                              <p className="text-xs text-destructive">{enrollmentForm.formState.errors.email.message}</p>
                            )}
                          </div>
                        </form>
                      </div>

                      <div>
                        <ImageDropzone
                          accept="image/*,application/pdf"
                          label="Upload bank voucher (image or PDF)"
                          hint="JPG, PNG, or PDF · max 10 MB · proof of payment"
                          value={voucherFile}
                          onSelect={setVoucherFile}
                          previewMode="wide"
                          mediaPreview="file"
                        />
                      </div>

                      <Button
                        type="button"
                        className="w-full py-6 text-base font-semibold"
                        disabled={createSubscriptionMutation.isPending || !selectedPlanId || !voucherFile}
                        onClick={async () => {
                          const isValid = await enrollmentForm.trigger();
                          if (!isValid || !selectedPlanId || !voucherFile || validId == null) {
                            return;
                          }

                          if (!user?.id) {
                            toast.error("Please sign in to complete your subscription.");
                            return;
                          }

                          const today = new Date().toISOString().slice(0, 10);
                          try {
                            await createSubscriptionMutation.mutateAsync({
                              plan_id: String(selectedPlanId),
                              course_id: String(validId),
                              user_id: String(user.id),
                              subscription_start_date: today,
                              purchase_date: today,
                              voucher_file: voucherFile,
                            });
                            setShowSuccess(true);
                          } catch {
                            // Errors surfaced by callApi / global handler
                          }
                        }}
                      >
                        {createSubscriptionMutation.isPending ? (
                          <Spinner className="mr-2 h-5 w-5" />
                        ) : null}
                        Buy Now & Submit Voucher for Review
                      </Button>
                    </div>
                  )}
                </>
              )
            ) : (
              /* Success View */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-8 rounded-full bg-emerald-100 p-6 dark:bg-emerald-900/50">
                  <CheckCircle className="h-16 w-16 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Thank You for Your Subscription!</h3>
                <p className="max-w-md text-muted-foreground mb-8">
                  Your voucher has been received. We will review your payment and activate the course subscription shortly.
                  You will receive a confirmation email from Raad Institute.
                </p>
                <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950/30 text-left w-full max-w-md">
                  <p className="font-medium text-emerald-700 dark:text-emerald-300 mb-2">Need help?</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Support: <span className="font-mono">+971 50 123 4567</span>
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setPlansOpen(false);
                    setShowSuccess(false);
                    setSelectedPlanId(null);
                    setVoucherFile(null);
                    enrollmentForm.reset();
                  }}
                  className="min-w-[200px]"
                >
                  Return to Course
                </Button>
              </div>
            )}
          </DrawerBody>

          {!showSuccess && (
            <DrawerFooter>
              <Button type="button" variant="outline" onClick={() => {
                setPlansOpen(false);
                setShowSuccess(false);
                setSelectedPlanId(null);
                setVoucherFile(null);
                enrollmentForm.reset(defaultFormValues);
              }}>
                Cancel
              </Button>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default CourseViewPage;
