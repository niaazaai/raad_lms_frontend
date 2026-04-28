import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Resolver } from "react-hook-form";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Attachment, BookStack, Check, Folder, Page, PageEdit, Play, Search } from "iconoir-react";
import { Button, Input, Label } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { API_V1_BASE } from "@/services/apiClient";
import {
  getCourseEntityDetailFromResponse,
  useCourseEntityDetail,
  useCourseEntityList,
  useCreateCourseEntity,
  useUpdateCourseEntity,
} from "../../hooks/useCourseEntity";

const lessonSchema = z.object({
  title: z.string().min(1, "Lesson title is required"),
  description: z.string().optional(),
});

const fileEntrySchema = z.object({
  title: z.string().optional(),
});

const schema = z.object({
  course_main_category_id: z.coerce.number().min(1, "Main category is required"),
  course_sub_category_id: z.coerce.number().min(1, "Sub category is required"),
  course_module_id: z.coerce.number().min(1, "Module is required"),
  title: z.string().min(1, "Title is required"),
  short_description: z.string().optional(),
  long_description: z.string().optional(),
  prerequisites: z.string().optional(),
  language: z.string().optional(),
  level: z.string().optional(),
  thumbnail: z.string().optional(),
  banner: z.string().optional(),
  price: z.coerce.number().optional(),
  instructor_id: z.coerce.number().optional(),
  estimated_duration: z.coerce.number().optional(),
  is_featured: z.boolean().default(false),
  is_popular: z.boolean().default(false),
  is_new: z.boolean().default(false),
  is_best_seller: z.boolean().default(false),
  is_free: z.boolean().default(false),
  lessons: z.array(lessonSchema).default([]),
  downloadable_resources: z.array(fileEntrySchema).default([]),
  quiz_files: z.array(fileEntrySchema).default([]),
});

type FormData = z.infer<typeof schema>;

type StepConfig = {
  id: string;
  title: string;
  hint: string;
  icon: ReactNode;
};

const steps: StepConfig[] = [
  {
    id: "category",
    title: "Select category",
    hint: "Main & sub category",
    icon: <Folder className="h-4 w-4 shrink-0 stroke-[1.5]" />,
  },
  {
    id: "details",
    title: "Course details",
    hint: "Title, media, pricing",
    icon: <PageEdit className="h-4 w-4 shrink-0 stroke-[1.5]" />,
  },
  {
    id: "modules",
    title: "Course modules",
    hint: "Faasl module",
    icon: <BookStack className="h-4 w-4 shrink-0 stroke-[1.5]" />,
  },
  {
    id: "lessons",
    title: "Lessons",
    hint: "Videos & assignments",
    icon: <Play className="h-4 w-4 shrink-0 stroke-[1.5]" />,
  },
  {
    id: "resources",
    title: "Downloadable resources",
    hint: "Files for learners",
    icon: <Attachment className="h-4 w-4 shrink-0 stroke-[1.5]" />,
  },
  {
    id: "quiz",
    title: "Quiz files",
    hint: "Assessment files",
    icon: <Page className="h-4 w-4 shrink-0 stroke-[1.5]" />,
  },
];

type CategoryRow = Record<string, unknown>;

const DESC_MAX_LEN = 200;

/** Tick inside circular indicator (DESIGN: subtle, not heavy) */
const CATEGORY_CARD_CHECK_ICON_CLASS = "h-3 w-3 stroke-[2]";

/** Full-circle checkbox at end of row; vertically centered with `items-center` on the button */
function CategoryCardSelectIndicator({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "flex size-[22px] shrink-0 items-center justify-center rounded-full border transition-colors",
        selected
          ? "border-primary bg-primary text-white"
          : "border-border bg-background text-transparent"
      )}
      aria-hidden
    >
      {selected ? <Check className={CATEGORY_CARD_CHECK_ICON_CLASS} /> : null}
    </span>
  );
}

function mainCategoryThumbnailUrl(id: number): string {
  return `${API_V1_BASE}/main-categories/${id}/thumbnail`;
}

function subCategoryThumbnailUrl(id: number): string {
  return `${API_V1_BASE}/sub-categories/${id}/thumbnail`;
}

function truncateDescription(raw: unknown, max = DESC_MAX_LEN): string {
  if (raw == null) return "";
  const s = String(raw).replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max)}...`;
}

function getThumbnailUrlFromRow(row: CategoryRow): string | null {
  const u = row.thumbnail_url;
  if (typeof u === "string" && u.trim().length > 0) return u.trim();
  return null;
}

function CategoryCardImage({
  thumbnailUrl,
  endpointFallbackUrl,
  title,
  sizeClass,
}: {
  thumbnailUrl?: string | null;
  endpointFallbackUrl: string;
  title: string;
  sizeClass: string;
}) {
  const initials =
    title.trim().length >= 2
      ? title.trim().slice(0, 2).toUpperCase()
      : title.trim().slice(0, 1).toUpperCase() || "?";

  type Phase = "api" | "endpoint" | "placeholder";
  const initialPhase: Phase =
    thumbnailUrl && String(thumbnailUrl).trim() !== "" ? "api" : "endpoint";

  const [phase, setPhase] = useState<Phase>(initialPhase);

  useEffect(() => {
    setPhase(thumbnailUrl && String(thumbnailUrl).trim() !== "" ? "api" : "endpoint");
  }, [thumbnailUrl, endpointFallbackUrl]);

  const src =
    phase === "api" && thumbnailUrl && String(thumbnailUrl).trim() !== ""
      ? String(thumbnailUrl).trim()
      : phase === "endpoint"
        ? endpointFallbackUrl
        : null;

  if (phase === "placeholder" || !src) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg border border-border/80 bg-primary/10 text-[10px] font-semibold text-primary shadow-inner",
          sizeClass
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={cn("shrink-0 rounded-lg border border-border object-cover", sizeClass)}
      onError={() => {
        if (phase === "api") setPhase("endpoint");
        else setPhase("placeholder");
      }}
    />
  );
}

function SelectionChips({ mainDone, subDone }: { mainDone: boolean; subDone: boolean }) {
  return (
    <div className="mb-3 flex shrink-0 flex-wrap items-center gap-6">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
            mainDone ? "border-primary bg-primary text-white" : "border-border bg-background"
          )}
          aria-hidden
        >
          {mainDone ? <Check className="h-3 w-3 stroke-[2]" /> : null}
        </span>
        <span className="text-sm font-medium text-foreground">Main category</span>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
            subDone ? "border-primary bg-primary text-white" : "border-border bg-background"
          )}
          aria-hidden
        >
          {subDone ? <Check className="h-3 w-3 stroke-[2]" /> : null}
        </span>
        <span className="text-sm font-medium text-foreground">Sub category</span>
      </div>
    </div>
  );
}

interface VerticalStepperProps {
  stepsConfig: StepConfig[];
  currentStep: number;
  stepComplete: boolean[];
  onStepChange: (index: number) => void;
}

function VerticalCourseStepper({
  stepsConfig,
  currentStep,
  stepComplete,
  onStepChange,
}: VerticalStepperProps) {
  return (
    <nav
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
      aria-label="Course wizard steps"
    >
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Steps
      </p>
      <ol className="relative space-y-0">
        {stepsConfig.map((step, index) => {
          const done = stepComplete[index];
          const active = currentStep === index;
          const isLast = index === stepsConfig.length - 1;

          return (
            <li key={step.id} className="relative flex gap-3">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onStepChange(index)}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    done && "border-primary bg-primary text-white shadow-sm shadow-primary/25",
                    active &&
                      !done &&
                      "border-primary bg-primary/10 text-primary ring-2 ring-primary/20",
                    !active &&
                      !done &&
                      "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:bg-muted"
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? <Check className="h-[18px] w-[18px] stroke-[2.5]" /> : step.icon}
                </button>
                {!isLast ? (
                  <div
                    className={cn(
                      "my-1 w-px min-h-[20px] flex-1",
                      stepComplete[index] ? "bg-primary/35" : "bg-border"
                    )}
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 pb-6 last:pb-0">
                <button
                  type="button"
                  onClick={() => onStepChange(index)}
                  className={cn(
                    "w-full rounded-lg px-2 py-1 text-left transition-colors",
                    active ? "bg-primary/10" : "hover:bg-muted/60"
                  )}
                >
                  <span
                    className={cn(
                      "block text-sm font-semibold leading-snug",
                      active ? "text-primary" : "text-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                    {step.hint}
                  </span>
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

const CourseWizardPage = () => {
  const textAreaClassName =
    "border-input bg-background ring-offset-background focus-visible:ring-ring min-h-[88px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60";

  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const viewMode = searchParams.get("mode") === "view";
  const editId = courseId ? Number(courseId) : null;
  const [currentStep, setCurrentStep] = useState(0);
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>({});

  const mainCategoriesQuery = useCourseEntityList("main-categories", { per_page: 200 });
  const subCategoriesQuery = useCourseEntityList("sub-categories", { per_page: 400 });
  const modulesQuery = useCourseEntityList("course-faasls", { per_page: 200 });
  const instructorsQuery = useCourseEntityList("instructors", { per_page: 200 });
  const detailQuery = useCourseEntityDetail("courses", editId, { enabled: editId != null });
  const createMutation = useCreateCourseEntity("courses");
  const updateMutation = useUpdateCourseEntity("courses");

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      lessons: [],
      downloadable_resources: [],
      quiz_files: [],
      is_featured: false,
      is_popular: false,
      is_new: false,
      is_best_seller: false,
      is_free: false,
    },
  });

  const { register, handleSubmit, setValue, watch, formState } = form;
  const lessonsField = useFieldArray({ control: form.control, name: "lessons" });
  const resourcesField = useFieldArray({ control: form.control, name: "downloadable_resources" });
  const quizField = useFieldArray({ control: form.control, name: "quiz_files" });

  const selectedMain = watch("course_main_category_id");
  const selectedSub = watch("course_sub_category_id");

  const mainRows = useMemo(() => {
    const raw = (mainCategoriesQuery.data as { data?: CategoryRow[] } | undefined)?.data ?? [];
    return raw;
  }, [mainCategoriesQuery.data]);

  const allSub = useMemo(() => {
    return (subCategoriesQuery.data as { data?: CategoryRow[] } | undefined)?.data ?? [];
  }, [subCategoriesQuery.data]);

  const filteredSubCategories = useMemo(() => {
    if (!selectedMain || Number(selectedMain) <= 0) return [];
    return allSub.filter((row) => Number(row.main_category_id) === Number(selectedMain));
  }, [allSub, selectedMain]);

  const [mainCategorySearch, setMainCategorySearch] = useState("");
  const [subCategorySearch, setSubCategorySearch] = useState("");

  const mainFilteredRows = useMemo(() => {
    const q = mainCategorySearch.trim().toLowerCase();
    if (!q) return mainRows;
    return mainRows.filter((row) => {
      const t = String(row.title ?? "").toLowerCase();
      const d = String(row.description ?? "").toLowerCase();
      return t.includes(q) || d.includes(q);
    });
  }, [mainRows, mainCategorySearch]);

  const subFilteredRows = useMemo(() => {
    const q = subCategorySearch.trim().toLowerCase();
    if (!q) return filteredSubCategories;
    return filteredSubCategories.filter((row) => {
      const t = String(row.title ?? "").toLowerCase();
      const d = String(row.description ?? "").toLowerCase();
      return t.includes(q) || d.includes(q);
    });
  }, [filteredSubCategories, subCategorySearch]);

  useEffect(() => {
    setSubCategorySearch("");
  }, [selectedMain]);

  useEffect(() => {
    const detail = getCourseEntityDetailFromResponse(detailQuery.data);
    if (!detail) return;
    setValue("course_main_category_id", Number(detail.course_main_category_id ?? 0));
    setValue("course_sub_category_id", Number(detail.course_sub_category_id ?? 0));
    setValue("course_module_id", Number(detail.course_module_id ?? 0));
    setValue("title", String(detail.title ?? ""));
    setValue("short_description", String(detail.short_description ?? ""));
    setValue("long_description", String(detail.long_description ?? ""));
    setValue("prerequisites", String(detail.prerequisites ?? ""));
    setValue("language", String(detail.language ?? ""));
    setValue("level", String(detail.level ?? ""));
    setValue("thumbnail", String(detail.thumbnail ?? ""));
    setValue("banner", String(detail.banner ?? ""));
    setValue("price", Number(detail.price ?? 0));
    setValue("instructor_id", Number(detail.instructor_id ?? 0));
    setValue("estimated_duration", Number(detail.estimated_duration ?? 0));
    setValue("is_featured", Boolean(detail.is_featured));
    setValue("is_popular", Boolean(detail.is_popular));
    setValue("is_new", Boolean(detail.is_new));
    setValue("is_best_seller", Boolean(detail.is_best_seller));
    setValue("is_free", Boolean(detail.is_free));
  }, [detailQuery.data, setValue]);

  const watchedValues = watch();
  const stepState = [
    Boolean(watchedValues.course_main_category_id) && Boolean(watchedValues.course_sub_category_id),
    Boolean(watchedValues.title),
    Boolean(watchedValues.course_module_id),
    watchedValues.lessons.length > 0,
    watchedValues.downloadable_resources.length > 0,
    watchedValues.quiz_files.length > 0,
  ];

  const mainSelected = Boolean(selectedMain && Number(selectedMain) > 0);
  const subSelected = Boolean(selectedSub && Number(selectedSub) > 0);

  const selectMainCategory = (id: number) => {
    if (viewMode) return;
    setValue("course_main_category_id", id, { shouldDirty: true, shouldValidate: true });
    setValue("course_sub_category_id", 0, { shouldDirty: true });
  };

  const selectSubCategory = (id: number) => {
    if (viewMode) return;
    setValue("course_sub_category_id", id, { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = (values: FormData) => {
    const payload: Record<string, unknown> = {
      course_main_category_id: values.course_main_category_id,
      course_sub_category_id: values.course_sub_category_id,
      course_module_id: values.course_module_id,
      title: values.title,
      short_description: values.short_description,
      long_description: values.long_description,
      prerequisites: values.prerequisites,
      language: values.language,
      level: values.level,
      thumbnail: values.thumbnail,
      banner: values.banner,
      price: values.price,
      instructor_id: values.instructor_id,
      estimated_duration: values.estimated_duration,
      is_featured: values.is_featured,
      is_popular: values.is_popular,
      is_new: values.is_new,
      is_best_seller: values.is_best_seller,
      is_free: values.is_free,
      status: "active",
    };

    if (editId && !Number.isNaN(editId)) {
      updateMutation.mutate(
        { id: editId, body: payload },
        { onSuccess: () => navigate("/course/courses") }
      );
      return;
    }
    createMutation.mutate(payload, { onSuccess: () => navigate("/course/courses") });
  };

  const simulateVideoUpload = (key: string) => {
    let progress = 0;
    const timer = setInterval(() => {
      progress += 10;
      setVideoProgress((prev) => ({ ...prev, [key]: Math.min(progress, 100) }));
      if (progress >= 100) clearInterval(timer);
    }, 250);
  };

  const mainLoading = mainCategoriesQuery.isFetching;
  const subLoading = subCategoriesQuery.isFetching;

  return (
    <div
      className={cn(
        "min-h-0 flex flex-col",
        currentStep === 0
          ? "max-h-full flex-1 gap-4 overflow-hidden p-4 md:p-6"
          : "space-y-6 p-4 md:p-6"
      )}
    >
      <div className={cn(currentStep === 0 && "shrink-0")}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {editId ? (viewMode ? "View course" : "Edit course") : "Create course"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete each step — you can move back anytime before saving.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={cn(
          "min-h-0 w-full",
          "grid gap-8 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]",
          currentStep === 0 ? "flex-1 overflow-hidden lg:items-stretch" : "lg:items-start"
        )}
      >
        <div className={cn("lg:sticky lg:top-4", currentStep === 0 && "self-start")}>
          <VerticalCourseStepper
            stepsConfig={steps}
            currentStep={currentStep}
            stepComplete={stepState}
            onStepChange={setCurrentStep}
          />
        </div>

        <section
          className={cn(
            "min-w-0 rounded-lg border border-border bg-card p-5 md:p-6",
            currentStep === 0 && "flex min-h-0 flex-1 flex-col overflow-hidden"
          )}
        >
          {currentStep === 0 && (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
              <div className="flex shrink-0 items-start gap-3 border-b border-border pb-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Folder className="h-5 w-5 stroke-[1.5]" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Select category</h2>
                  <p className="text-sm text-muted-foreground">
                    Choose a main category, then pick a sub category on the right.
                  </p>
                </div>
              </div>

              <SelectionChips mainDone={mainSelected} subDone={subSelected} />

              <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-2 lg:gap-4">
                {/* Main categories — DESIGN: thin border, flat card, scroll inside only */}
                <div
                  className={cn(
                    "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card p-3"
                  )}
                >
                  <h3 className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Main categories
                  </h3>
                  <div className="relative mb-2 shrink-0">
                    <Search
                      className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      strokeWidth={1.5}
                    />
                    <Input
                      type="search"
                      value={mainCategorySearch}
                      onChange={(e) => setMainCategorySearch(e.target.value)}
                      placeholder="Search title or description…"
                      className="h-9 border-border/90 bg-background pl-9 text-sm shadow-inner"
                      aria-label="Search main categories"
                    />
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain rounded-md border border-border/80 bg-muted/20 p-1.5">
                    {mainLoading ? (
                      <div className="flex min-h-[120px] flex-1 items-center justify-center py-6">
                        <Spinner className="h-8 w-8 text-primary" />
                      </div>
                    ) : mainRows.length === 0 ? (
                      <p className="px-2 py-4 text-sm text-muted-foreground">
                        No main categories available.
                      </p>
                    ) : mainFilteredRows.length === 0 ? (
                      <p className="px-2 py-4 text-sm text-muted-foreground">
                        No matches for &quot;{mainCategorySearch.trim()}&quot;.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {mainFilteredRows.map((row) => {
                          const id = Number(row.id);
                          const title = String(row.title ?? "");
                          const descRaw = row.description;
                          const descShown = truncateDescription(descRaw, DESC_MAX_LEN);
                          const thumb = getThumbnailUrlFromRow(row);
                          const isActive = Number(selectedMain) === id;
                          return (
                            <button
                              key={String(row.id)}
                              type="button"
                              disabled={viewMode}
                              onClick={() => selectMainCategory(id)}
                              className={cn(
                                "flex w-full cursor-pointer items-center gap-2 rounded-lg border p-2 text-left transition-colors duration-150",
                                "disabled:pointer-events-none disabled:opacity-50",
                                isActive
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                  : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
                              )}
                            >
                              <CategoryCardImage
                                thumbnailUrl={thumb}
                                endpointFallbackUrl={mainCategoryThumbnailUrl(id)}
                                title={title}
                                sizeClass="h-9 w-9"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold leading-snug text-foreground">
                                  {title}
                                </p>
                                {descShown.length > 0 ? (
                                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                    {descShown}
                                  </p>
                                ) : null}
                              </div>
                              <CategoryCardSelectIndicator selected={isActive} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub categories */}
                <div
                  className={cn(
                    "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card p-3"
                  )}
                >
                  <h3 className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Sub categories
                  </h3>
                  <div className="relative mb-2 shrink-0">
                    <Search
                      className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      strokeWidth={1.5}
                    />
                    <Input
                      type="search"
                      value={subCategorySearch}
                      onChange={(e) => setSubCategorySearch(e.target.value)}
                      placeholder="Search title or description…"
                      disabled={!mainSelected}
                      className="h-9 border-border/90 bg-background pl-9 text-sm shadow-inner disabled:opacity-50"
                      aria-label="Search sub categories"
                    />
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain rounded-md border border-border/80 bg-muted/20 p-1.5">
                    {!mainSelected ? (
                      <div className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 px-4 py-8 text-center">
                        <Folder className="h-9 w-9 text-muted-foreground/45 stroke-[1]" />
                        <p className="text-sm text-muted-foreground">
                          Select a main category to load sub categories.
                        </p>
                      </div>
                    ) : subLoading ? (
                      <div className="flex min-h-[140px] items-center justify-center py-8">
                        <Spinner className="h-8 w-8 text-primary" />
                      </div>
                    ) : filteredSubCategories.length === 0 ? (
                      <p className="px-2 py-4 text-sm text-muted-foreground">
                        No sub categories for this main category.
                      </p>
                    ) : subFilteredRows.length === 0 ? (
                      <p className="px-2 py-4 text-sm text-muted-foreground">
                        No matches for &quot;{subCategorySearch.trim()}&quot;.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {subFilteredRows.map((row) => {
                          const id = Number(row.id);
                          const title = String(row.title ?? "");
                          const descRaw = row.description;
                          const descShown = truncateDescription(descRaw, DESC_MAX_LEN);
                          const thumb = getThumbnailUrlFromRow(row);
                          const isActive = Number(selectedSub) === id;
                          return (
                            <button
                              key={String(row.id)}
                              type="button"
                              disabled={viewMode}
                              onClick={() => selectSubCategory(id)}
                              className={cn(
                                "flex w-full cursor-pointer items-center gap-2 rounded-lg border p-2 text-left transition-colors duration-150",
                                "disabled:pointer-events-none disabled:opacity-50",
                                isActive
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                  : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
                              )}
                            >
                              <CategoryCardImage
                                thumbnailUrl={thumb}
                                endpointFallbackUrl={subCategoryThumbnailUrl(id)}
                                title={title}
                                sizeClass="h-8 w-8"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold leading-snug text-foreground">
                                  {title}
                                </p>
                                {descShown.length > 0 ? (
                                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                    {descShown}
                                  </p>
                                ) : null}
                              </div>
                              <CategoryCardSelectIndicator selected={isActive} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <input type="hidden" {...register("course_main_category_id")} />
              <input type="hidden" {...register("course_sub_category_id")} />
            </div>
          )}

          {currentStep === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Title</Label>
                <Input {...register("title")} disabled={viewMode} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Short description</Label>
                <textarea
                  className={textAreaClassName}
                  {...register("short_description")}
                  disabled={viewMode}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Long description</Label>
                <textarea
                  className={textAreaClassName}
                  {...register("long_description")}
                  disabled={viewMode}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Prerequisites</Label>
                <textarea
                  className={textAreaClassName}
                  {...register("prerequisites")}
                  disabled={viewMode}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Language</Label>
                <Input {...register("language")} disabled={viewMode} />
              </div>
              <div className="space-y-1.5">
                <Label>Level</Label>
                <Input {...register("level")} disabled={viewMode} />
              </div>
              <div className="space-y-1.5">
                <Label>Thumbnail</Label>
                <Input {...register("thumbnail")} disabled={viewMode} />
              </div>
              <div className="space-y-1.5">
                <Label>Banner</Label>
                <Input {...register("banner")} disabled={viewMode} />
              </div>
              <div className="space-y-1.5">
                <Label>Price</Label>
                <Input type="number" {...register("price")} disabled={viewMode} />
              </div>
              <div className="space-y-1.5">
                <Label>Instructor</Label>
                <select
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
                  {...register("instructor_id")}
                  disabled={viewMode}
                >
                  <option value="">Select instructor</option>
                  {(
                    (instructorsQuery.data as { data?: Array<Record<string, unknown>> } | undefined)
                      ?.data ?? []
                  ).map((row) => (
                    <option key={String(row.id)} value={Number(row.user_id ?? row.id)}>
                      {String(row.user_name ?? row.specialization ?? `Instructor #${row.id}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Course duration (min)</Label>
                <Input type="number" {...register("estimated_duration")} disabled={viewMode} />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-5">
                {(
                  ["is_featured", "is_popular", "is_new", "is_best_seller", "is_free"] as const
                ).map((key) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      {...register(key)}
                      disabled={viewMode}
                      className="rounded border-input"
                    />
                    <span className="capitalize">{key.replace("is_", "").replace("_", " ")}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-1.5">
              <Label>Course module (Faasl)</Label>
              <select
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
                {...register("course_module_id")}
                disabled={viewMode}
              >
                <option value="">Select module</option>
                {(
                  (modulesQuery.data as { data?: Array<Record<string, unknown>> } | undefined)
                    ?.data ?? []
                ).map((row) => (
                  <option key={String(row.id)} value={Number(row.id)}>
                    {String(row.title ?? "")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <h3 className="font-medium">Lessons</h3>
                {!viewMode && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => lessonsField.append({ title: "", description: "" })}
                  >
                    Add lesson
                  </Button>
                )}
              </div>
              {lessonsField.fields.map((field, idx) => (
                <div key={field.id} className="space-y-2 rounded-md border border-border p-3">
                  <Input
                    placeholder="Lesson title"
                    {...register(`lessons.${idx}.title`)}
                    disabled={viewMode}
                  />
                  <textarea
                    className={textAreaClassName}
                    placeholder="Lesson description"
                    {...register(`lessons.${idx}.description`)}
                    disabled={viewMode}
                  />
                  <div className="space-y-1">
                    <Label>Lesson video</Label>
                    <input
                      type="file"
                      accept="video/*"
                      disabled={viewMode}
                      onChange={() => simulateVideoUpload(`lesson-${idx}`)}
                    />
                    {videoProgress[`lesson-${idx}`] !== undefined ? (
                      <div className="h-2 rounded bg-muted">
                        <div
                          className="h-2 rounded bg-primary"
                          style={{ width: `${videoProgress[`lesson-${idx}`]}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                  {!viewMode ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => lessonsField.remove(idx)}
                    >
                      Remove lesson
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <h3 className="font-medium">Downloadable resources</h3>
                {!viewMode ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => resourcesField.append({ title: "" })}
                  >
                    Add file
                  </Button>
                ) : null}
              </div>
              {resourcesField.fields.map((field, idx) => (
                <div key={field.id} className="space-y-2 rounded-md border border-border p-3">
                  <Input
                    placeholder="Optional title"
                    {...register(`downloadable_resources.${idx}.title`)}
                    disabled={viewMode}
                  />
                  <input type="file" disabled={viewMode} />
                  {!viewMode ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => resourcesField.remove(idx)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <h3 className="font-medium">Quiz files</h3>
                {!viewMode ? (
                  <Button type="button" size="sm" onClick={() => quizField.append({ title: "" })}>
                    Add file
                  </Button>
                ) : null}
              </div>
              {quizField.fields.map((field, idx) => (
                <div key={field.id} className="space-y-2 rounded-md border border-border p-3">
                  <Input
                    placeholder="Optional title"
                    {...register(`quiz_files.${idx}.title`)}
                    disabled={viewMode}
                  />
                  <input type="file" disabled={viewMode} />
                  {!viewMode ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => quizField.remove(idx)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {!viewMode && formState.errors.title ? (
            <p className="text-sm text-danger">{formState.errors.title.message}</p>
          ) : null}

          <div className="mt-6 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
            >
              Previous
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" onClick={() => navigate("/course/courses")}>
                Cancel
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    "Save course"
                  )}
                </Button>
              )}
            </div>
          </div>
        </section>
      </form>
    </div>
  );
};

export default CourseWizardPage;
