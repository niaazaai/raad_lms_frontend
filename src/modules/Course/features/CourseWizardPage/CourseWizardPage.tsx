import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Resolver } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Attachment,
  Check,
  EditPencil,
  Folder,
  Page,
  PageEdit,
  Play,
  Plus,
  Search,
  Trash,
} from "iconoir-react";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
  ImageDropzone,
  Input,
  Label,
  RichTextEditor,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from "@/components/ui";
import {
  COURSE_LANGUAGE_OPTIONS,
  COURSE_LEVEL_OPTIONS,
  CourseLanguage,
  CourseLevel,
  type CourseLanguageValue,
  type CourseLevelValue,
} from "@/data/enums/courseWizard";
import { cn } from "@/lib/utils";
import { API_V1_BASE } from "@/services/apiClient";
import {
  getCourseEntityDetailFromResponse,
  getCourseListFromResponse,
  useCourseEntityDetail,
  useCourseEntityList,
  useCreateCourseEntity,
  useDeleteCourseEntity,
  useUpdateCourseEntity,
} from "../../hooks/useCourseEntity";

const COURSE_DETAIL_FLAG_FIELDS = [
  "is_featured",
  "is_popular",
  "is_new",
  "is_best_seller",
  "is_free",
] as const;

type CourseDetailFlagField = (typeof COURSE_DETAIL_FLAG_FIELDS)[number];

const COURSE_DETAIL_FLAG_LABELS: Record<CourseDetailFlagField, string> = {
  is_featured: "Featured",
  is_popular: "Popular",
  is_new: "New",
  is_best_seller: "Best seller",
  is_free: "Free",
};

/** Radix Select cannot use empty string — optional numeric FKs use this sentinel */
const SELECT_NONE_VALUE = "__none__";

const courseLanguageSchema = z.enum(["PASHTOO", "DARI", "ENGLISH"]);
const courseLevelSchema = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);

const schema = z.object({
  course_main_category_id: z.coerce.number().min(1, "Main category is required"),
  course_sub_category_id: z.coerce.number().min(1, "Sub category is required"),
  course_module_id: z.coerce.number().optional(),
  title: z.string().min(1, "Title is required"),
  short_description: z.string().optional(),
  long_description: z.string().optional(),
  prerequisites: z.string().optional(),
  language: courseLanguageSchema.default(CourseLanguage.DARI),
  level: courseLevelSchema.default(CourseLevel.INTERMEDIATE),
  thumbnail: z.string().optional(),
  banner: z.string().optional(),
  price: z.coerce.number().optional(),
  instructor_id: z.coerce.number().optional(),
  is_featured: z.boolean().default(false),
  is_popular: z.boolean().default(false),
  is_new: z.boolean().default(false),
  is_best_seller: z.boolean().default(false),
  is_free: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

type StepConfig = {
  id: string;
  title: string;
  hint: string;
};

const steps: StepConfig[] = [
  {
    id: "category",
    title: "Select category",
    hint: "Main & sub category",
  },
  {
    id: "details",
    title: "Course details",
    hint: "Title, media, pricing",
  },
  {
    id: "lessons",
    title: "Lessons",
    hint: "Modules & lesson videos",
  },
  {
    id: "resources",
    title: "Downloadable resources",
    hint: "Files for learners",
  },
  {
    id: "quiz",
    title: "Quiz files",
    hint: "Assessment files",
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

function normalizeCourseLanguage(raw: unknown): CourseLanguageValue {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (s === "PASHTOO" || s === "DARI" || s === "ENGLISH") return s;
  return CourseLanguage.DARI;
}

function normalizeCourseLevel(raw: unknown): CourseLevelValue {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (s === "BEGINNER" || s === "INTERMEDIATE" || s === "ADVANCED") return s;
  return CourseLevel.INTERMEDIATE;
}

function mediaUrlForPreview(path: unknown): string | undefined {
  if (path == null) return undefined;
  const u = String(path).trim();
  if (!u) return undefined;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return u;
  return undefined;
}

function fileLabelFromUrl(path: unknown): string {
  const u = String(path ?? "").trim();
  if (!u) return "";
  const seg = u.split(/[/\\]/).pop();
  return seg && seg.length > 0 ? seg : u;
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
  const stepIcon = (step: StepConfig, index: number) => {
    const ic = "h-[18px] w-[18px] shrink-0 text-current";
    switch (step.id) {
      case "category":
        return <Folder className={ic} strokeWidth={1.5} aria-hidden />;
      case "details":
        return <PageEdit className={ic} strokeWidth={1.5} aria-hidden />;
      case "lessons":
        return <Play className={ic} strokeWidth={1.5} aria-hidden />;
      case "resources":
        return <Attachment className={ic} strokeWidth={1.5} aria-hidden />;
      case "quiz":
        return <Page className={ic} strokeWidth={1.5} aria-hidden />;
      default:
        return <span className="text-xs font-semibold tabular-nums">{index + 1}</span>;
    }
  };

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
          /** Checkmark for completed steps only when not the current step — avoids "pre-filled" look */
          const showDoneMark = done && !active;
          const isLast = index === stepsConfig.length - 1;

          return (
            <li key={step.id} className="relative flex gap-3">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onStepChange(index)}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    showDoneMark &&
                      "border-primary bg-primary text-white shadow-sm shadow-primary/25",
                    active &&
                      !showDoneMark &&
                      "border-primary bg-primary/10 text-primary ring-2 ring-primary/20",
                    !active &&
                      !showDoneMark &&
                      "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:bg-muted"
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {showDoneMark ? (
                    <Check className="h-[18px] w-[18px] text-white" strokeWidth={2.5} aria-hidden />
                  ) : (
                    stepIcon(step, index)
                  )}
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

interface FieldLabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}

function FieldLabel({ htmlFor, children, required }: FieldLabelProps) {
  return (
    <Label htmlFor={htmlFor}>
      <span>{children}</span>
      {required ? (
        <span className="text-danger ml-0.5 font-semibold" aria-hidden>
          *
        </span>
      ) : null}
    </Label>
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
  /** Persisted course id before route includes `:courseId` (create flow). */
  const [draftCourseId, setDraftCourseId] = useState<number | null>(null);
  const effectiveCourseId = editId ?? draftCourseId;

  const queryClient = useQueryClient();

  const mainCategoriesQuery = useCourseEntityList("main-categories", { per_page: 200 });
  const subCategoriesQuery = useCourseEntityList("sub-categories", { per_page: 400 });
  const instructorsQuery = useCourseEntityList("instructors", { per_page: 200 });
  const detailQuery = useCourseEntityDetail("courses", editId, { enabled: editId != null });

  const modulesQuery = useCourseEntityList(
    effectiveCourseId != null ? "course-faasls" : null,
    effectiveCourseId != null ? { course_id: effectiveCourseId, per_page: 200 } : undefined,
    { enabled: effectiveCourseId != null }
  );
  const lessonsQuery = useCourseEntityList(
    effectiveCourseId != null ? "lessons" : null,
    effectiveCourseId != null ? { course_id: effectiveCourseId, per_page: 500 } : undefined,
    { enabled: effectiveCourseId != null }
  );
  const resourcesListQuery = useCourseEntityList(
    effectiveCourseId != null ? "downloadable-resources" : null,
    effectiveCourseId != null ? { course_id: effectiveCourseId, per_page: 200 } : undefined,
    { enabled: effectiveCourseId != null }
  );
  const quizListQuery = useCourseEntityList(
    effectiveCourseId != null ? "quiz-files" : null,
    effectiveCourseId != null ? { course_id: effectiveCourseId, per_page: 200 } : undefined,
    { enabled: effectiveCourseId != null }
  );

  const createMutation = useCreateCourseEntity("courses");
  const updateMutation = useUpdateCourseEntity("courses");
  const createFaaslMutation = useCreateCourseEntity("course-faasls");
  const updateFaaslMutation = useUpdateCourseEntity("course-faasls");
  const deleteFaaslMutation = useDeleteCourseEntity("course-faasls");
  const createLessonMutation = useCreateCourseEntity("lessons");
  const updateLessonMutation = useUpdateCourseEntity("lessons");
  const deleteLessonMutation = useDeleteCourseEntity("lessons");
  const createResourceMutation = useCreateCourseEntity("downloadable-resources");
  const updateResourceMutation = useUpdateCourseEntity("downloadable-resources");
  const deleteResourceMutation = useDeleteCourseEntity("downloadable-resources");
  const createQuizMutation = useCreateCourseEntity("quiz-files");
  const updateQuizMutation = useUpdateCourseEntity("quiz-files");
  const deleteQuizMutation = useDeleteCourseEntity("quiz-files");

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      course_main_category_id: 0,
      course_sub_category_id: 0,
      course_module_id: undefined,
      title: "",
      is_featured: false,
      is_popular: false,
      is_new: false,
      is_best_seller: false,
      is_free: false,
      language: CourseLanguage.DARI,
      level: CourseLevel.INTERMEDIATE,
    },
  });

  const { register, handleSubmit, setValue, watch, control, formState, getValues } = form;

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});

  const [resourceDrawerOpen, setResourceDrawerOpen] = useState(false);
  const [resourceDraft, setResourceDraft] = useState<{
    id?: number;
    title: string;
    file: File | null;
    existingFileUrl?: string | null;
  }>({ title: "", file: null });

  const [quizDrawerOpen, setQuizDrawerOpen] = useState(false);
  const [quizDraft, setQuizDraft] = useState<{
    id?: number;
    title: string;
    file: File | null;
    existingFileUrl?: string | null;
  }>({ title: "", file: null });

  const [lessonDialog, setLessonDialog] = useState<{
    open: boolean;
    moduleId: number;
    lessonId: number | null;
    title: string;
  }>({ open: false, moduleId: 0, lessonId: null, title: "" });

  const [moduleRenameDialog, setModuleRenameDialog] = useState<{
    open: boolean;
    id: number;
    title: string;
  }>({ open: false, id: 0, title: "" });

  const selectedMain = watch("course_main_category_id");
  const selectedSub = watch("course_sub_category_id");

  const mainRows = useMemo(
    () => getCourseListFromResponse(mainCategoriesQuery.data),
    [mainCategoriesQuery.data]
  );

  const allSub = useMemo(
    () => getCourseListFromResponse(subCategoriesQuery.data),
    [subCategoriesQuery.data]
  );

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
    const cm = Number(detail.course_module_id ?? 0);
    setValue("course_module_id", cm > 0 ? cm : undefined);
    setValue("title", String(detail.title ?? ""));
    setValue("short_description", String(detail.short_description ?? ""));
    setValue("long_description", String(detail.long_description ?? ""));
    setValue("prerequisites", String(detail.prerequisites ?? ""));
    setValue("language", normalizeCourseLanguage(detail.language));
    setValue("level", normalizeCourseLevel(detail.level));
    setValue("thumbnail", String(detail.thumbnail ?? ""));
    setValue("banner", String(detail.banner ?? ""));
    setValue("price", Number(detail.price ?? 0));
    const instructorId = Number(detail.instructor_id ?? 0);
    setValue("instructor_id", instructorId > 0 ? instructorId : undefined);
    setValue("is_featured", Boolean(detail.is_featured));
    setValue("is_popular", Boolean(detail.is_popular));
    setValue("is_new", Boolean(detail.is_new));
    setValue("is_best_seller", Boolean(detail.is_best_seller));
    setValue("is_free", Boolean(detail.is_free));
    setThumbnailFile(null);
    setBannerFile(null);
  }, [detailQuery.data, setValue]);

  const watchedValues = watch();

  const numId = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const modulesRowsStep = useMemo(
    () => getCourseListFromResponse(modulesQuery.data),
    [modulesQuery.data]
  );
  const lessonsRowsStep = useMemo(
    () => getCourseListFromResponse(lessonsQuery.data),
    [lessonsQuery.data]
  );

  const stepState = [
    numId(watchedValues.course_main_category_id) > 0 &&
      numId(watchedValues.course_sub_category_id) > 0,
    String(watchedValues.title ?? "").trim().length > 0,
    modulesRowsStep.length >= 1 && lessonsRowsStep.length >= 1,
    true,
    true,
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
      course_module_id:
        values.course_module_id != null && Number(values.course_module_id) > 0
          ? Number(values.course_module_id)
          : null,
      title: values.title,
      short_description: values.short_description,
      long_description: values.long_description,
      prerequisites: values.prerequisites,
      language: values.language,
      level: values.level,
      price: values.price,
      instructor_id: values.instructor_id,
      is_featured: values.is_featured,
      is_popular: values.is_popular,
      is_new: values.is_new,
      is_best_seller: values.is_best_seller,
      is_free: values.is_free,
      status: "active",
    };

    if (thumbnailFile) {
      payload.thumbnail_file = thumbnailFile;
    } else {
      payload.thumbnail = values.thumbnail ?? "";
    }

    if (bannerFile) {
      payload.banner_file = bannerFile;
    } else {
      payload.banner = values.banner ?? "";
    }

    const targetId = editId ?? draftCourseId;
    if (targetId && !Number.isNaN(targetId)) {
      updateMutation.mutate(
        { id: targetId, body: payload },
        { onSuccess: () => navigate("/course/courses") }
      );
      return;
    }
    createMutation.mutate(payload, { onSuccess: () => navigate("/course/courses") });
  };

  const ensureCoursePersisted = async (): Promise<number> => {
    if (editId != null && !Number.isNaN(editId)) return editId;
    if (draftCourseId != null) return draftCourseId;
    const values = getValues();
    const payload: Record<string, unknown> = {
      course_main_category_id: values.course_main_category_id,
      course_sub_category_id: values.course_sub_category_id,
      course_module_id:
        values.course_module_id != null && Number(values.course_module_id) > 0
          ? Number(values.course_module_id)
          : null,
      title: values.title,
      short_description: values.short_description,
      long_description: values.long_description,
      prerequisites: values.prerequisites,
      language: values.language,
      level: values.level,
      price: values.price,
      instructor_id: values.instructor_id,
      is_featured: values.is_featured,
      is_popular: values.is_popular,
      is_new: values.is_new,
      is_best_seller: values.is_best_seller,
      is_free: values.is_free,
      status: "active",
    };
    if (thumbnailFile) payload.thumbnail_file = thumbnailFile;
    else payload.thumbnail = values.thumbnail ?? "";
    if (bannerFile) payload.banner_file = bannerFile;
    else payload.banner = values.banner ?? "";

    const res = await createMutation.mutateAsync(payload);
    const fromEnvelope = getCourseEntityDetailFromResponse(res as unknown);
    const fallbackId =
      res && typeof res === "object" && res !== null && "id" in res
        ? (res as { id?: unknown }).id
        : undefined;
    const nid = Number(fromEnvelope?.id ?? fallbackId ?? 0);
    if (!nid) throw new Error("Course could not be saved");
    setDraftCourseId(nid);
    await queryClient.invalidateQueries({ queryKey: ["course", "entity", "courses"] });
    return nid;
  };

  const advanceStep = async () => {
    try {
      if (currentStep === 1 && !viewMode) {
        await ensureCoursePersisted();
      }
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    } catch {
      /* create/update draft failed — stay on step */
    }
  };

  const goToStep = async (index: number) => {
    if (index > currentStep && index >= 2 && !editId && draftCourseId == null && !viewMode) {
      try {
        await ensureCoursePersisted();
      } catch {
        return;
      }
    }
    setCurrentStep(index);
  };

  const invalidateCourseLists = () => {
    void queryClient.invalidateQueries({ queryKey: ["course"] });
  };

  const mainLoading = mainCategoriesQuery.isFetching;
  const subLoading = subCategoriesQuery.isFetching;

  const instructorRows = useMemo(
    () =>
      (instructorsQuery.data as { data?: Array<Record<string, unknown>> } | undefined)?.data ?? [],
    [instructorsQuery.data]
  );

  const resourcesRows = useMemo(
    () => getCourseListFromResponse(resourcesListQuery.data),
    [resourcesListQuery.data]
  );
  const quizRowsList = useMemo(
    () => getCourseListFromResponse(quizListQuery.data),
    [quizListQuery.data]
  );

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-col",
        currentStep === 0
          ? "h-full max-h-full flex-1 gap-4 overflow-hidden"
          : "space-y-6"
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
          "grid min-h-0 w-full gap-8 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]",
          currentStep === 0
            ? "min-h-0 flex-1 overflow-hidden lg:items-stretch [&>*]:min-h-0"
            : "lg:items-start"
        )}
      >
        <div className={cn("min-h-0 lg:sticky lg:top-4", currentStep === 0 ? "self-start" : "")}>
          <VerticalCourseStepper
            stepsConfig={steps}
            currentStep={currentStep}
            stepComplete={stepState}
            onStepChange={goToStep}
          />
        </div>

        <section
          className={cn(
            "min-w-0 rounded-lg border border-border bg-card p-5 md:p-6",
            currentStep === 0 && "flex min-h-0 flex-1 flex-col overflow-hidden"
          )}
        >
          <input type="hidden" {...register("course_main_category_id", { valueAsNumber: true })} />
          <input type="hidden" {...register("course_sub_category_id", { valueAsNumber: true })} />
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
                      className="  absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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
                  <div>
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
                                "relative z-10 flex w-full cursor-pointer items-center gap-2 rounded-lg border p-2 text-left transition-colors duration-150",
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
                      className="  absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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
                  <div>
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
                                "relative z-10 flex w-full cursor-pointer items-center gap-2 rounded-lg border p-2 text-left transition-colors duration-150",
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
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <input type="hidden" {...register("thumbnail")} />
              <input type="hidden" {...register("banner")} />

              <div className="space-y-1.5">
                <FieldLabel htmlFor="course-title" required>
                  Course title
                </FieldLabel>
                <Input
                  id="course-title"
                  placeholder="e.g. Practical accounting fundamentals"
                  {...register("title")}
                  disabled={viewMode}
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel htmlFor="course-short-description">Short description</FieldLabel>
                <textarea
                  id="course-short-description"
                  className={textAreaClassName}
                  placeholder="One or two lines for cards and listings (shown in browse views)"
                  {...register("short_description")}
                  disabled={viewMode}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="min-w-0 space-y-1.5">
                  <FieldLabel>Long description</FieldLabel>
                  <Controller
                    name="long_description"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        disabled={viewMode}
                        minHeight="min-h-[220px]"
                        placeholder="Describe modules, learning outcomes, format, and ideal audience…"
                      />
                    )}
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <FieldLabel>Prerequisites</FieldLabel>
                  <Controller
                    name="prerequisites"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        disabled={viewMode}
                        minHeight="min-h-[220px]"
                        placeholder="Prior courses, skills, or experience learners should have…"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="min-w-0 space-y-1.5">
                  <FieldLabel htmlFor="course-language">Language</FieldLabel>
                  <Controller
                    name="language"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={viewMode}
                      >
                        <SelectTrigger id="course-language">
                          <SelectValue placeholder="Teaching language" />
                        </SelectTrigger>
                        <SelectContent>
                          {COURSE_LANGUAGE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <FieldLabel htmlFor="course-level">Level</FieldLabel>
                  <Controller
                    name="level"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={viewMode}>
                        <SelectTrigger id="course-level">
                          <SelectValue placeholder="Difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          {COURSE_LEVEL_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <FieldLabel htmlFor="course-price">Price</FieldLabel>
                  <Input
                    id="course-price"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    {...register("price")}
                    disabled={viewMode}
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <FieldLabel htmlFor="course-instructor">Instructor</FieldLabel>
                  <Controller
                    name="instructor_id"
                    control={control}
                    render={({ field }) => {
                      const sel =
                        field.value != null && Number(field.value) > 0
                          ? String(Number(field.value))
                          : SELECT_NONE_VALUE;
                      return (
                        <Select
                          value={sel}
                          onValueChange={(next) => {
                            if (next === SELECT_NONE_VALUE) field.onChange(undefined);
                            else field.onChange(Number(next));
                          }}
                          disabled={viewMode}
                        >
                          <SelectTrigger id="course-instructor">
                            <SelectValue placeholder="Choose an instructor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SELECT_NONE_VALUE}>No instructor</SelectItem>
                            {instructorRows.map((row) => (
                              <SelectItem
                                key={String(row.id)}
                                value={String(Number(row.user_id ?? row.id))}
                              >
                                {String(row.user_name ?? row.specialization ?? `Instructor #${row.id}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <ImageDropzone
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  label="Thumbnail"
                  hint="JPEG, PNG, WebP or GIF — click or drag to upload"
                  value={thumbnailFile}
                  onSelect={(file) => {
                    setThumbnailFile(file);
                    if (!file) setValue("thumbnail", "");
                  }}
                  previewMode="square"
                  initialPreviewUrl={thumbnailFile ? null : mediaUrlForPreview(watch("thumbnail"))}
                  initialPreviewName={(watch("thumbnail") ?? "").trim() || null}
                />
                <ImageDropzone
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  label="Banner"
                  hint="Wide banner — JPEG, PNG, WebP or GIF"
                  value={bannerFile}
                  onSelect={(file) => {
                    setBannerFile(file);
                    if (!file) setValue("banner", "");
                  }}
                  previewMode="wide"
                  initialPreviewUrl={bannerFile ? null : mediaUrlForPreview(watch("banner"))}
                  initialPreviewName={(watch("banner") ?? "").trim() || null}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {COURSE_DETAIL_FLAG_FIELDS.map((key) => (
                  <label
                    key={key}
                    className={cn(
                      "relative flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card px-2 py-3 text-center shadow-sm transition-colors",
                      "hover:border-primary/35 hover:bg-muted/20",
                      "[&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/10",
                      viewMode && "pointer-events-none opacity-60"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      {...register(key)}
                      disabled={viewMode}
                    />
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border bg-background transition-all duration-200 ease-out",
                        "peer-checked:border-primary peer-checked:bg-primary",
                        "peer-checked:[&_svg]:scale-100 peer-checked:[&_svg]:opacity-100"
                      )}
                    >
                      <Check
                        className="h-3.5 w-3.5 scale-50 stroke-[2.5] text-white opacity-0 transition-all duration-200 ease-out"
                        aria-hidden
                      />
                    </span>
                    <span className="text-xs font-medium leading-snug text-foreground">
                      {COURSE_DETAIL_FLAG_LABELS[key]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && effectiveCourseId != null && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Lessons</h3>
                  <p className="text-sm text-muted-foreground">
                    Modules (Faasl) group your lesson videos — expand each module to manage lessons.
                  </p>
                </div>
                {!viewMode ? (
                  <Button
                    type="button"
                    onClick={() => {
                      setNewModuleTitle("");
                      setModuleModalOpen(true);
                    }}
                  >
                    <Plus className=" h-4 w-4" strokeWidth={2} />
                       
                  </Button>
                ) : null}
              </div>

              {modulesRowsStep.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                  No modules yet — click &quot;New Module&quot; to create one for this course.
                </div>
              ) : (
                <div className="space-y-3">
                  {modulesRowsStep.map((mod) => {
                    const mid = Number(mod.id);
                    const open = expandedModules[mid] ?? true;
                    const lessonsForModule = lessonsRowsStep.filter(
                      (row) => Number(row.course_module_id) === mid
                    );
                    return (
                      <div key={mid} className="overflow-hidden rounded-lg border border-border bg-card">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                          onClick={() =>
                            setExpandedModules((prev) => ({ ...prev, [mid]: !open }))
                          }
                        >
                          <span className="min-w-0 flex-1 truncate font-semibold text-foreground">
                            {String(mod.title ?? "")}
                          </span>
                          {!viewMode ? (
                            <span className="flex shrink-0 items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setModuleRenameDialog({
                                    open: true,
                                    id: mid,
                                    title: String(mod.title ?? ""),
                                  });
                                }}
                              >
                                <EditPencil className="h-4 w-4" strokeWidth={1.5} />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-danger hover:text-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteFaaslMutation.mutate(mid, {
                                    onSuccess: () => invalidateCourseLists(),
                                  });
                                }}
                              >
                                <Trash className="h-4 w-4" strokeWidth={1.5} />
                              </Button>
                            </span>
                          ) : null}
                        </button>
                        {open ? (
                          <div className="space-y-2 border-t border-border bg-muted/10 px-4 py-3">
                            {lessonsForModule.length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                No lessons in this module yet.
                              </p>
                            ) : (
                              lessonsForModule.map((lesson) => {
                                const lid = Number(lesson.id);
                                return (
                                  <div
                                    key={lid}
                                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
                                  >
                                    <span className="min-w-0 truncate text-sm font-medium">
                                      {String(lesson.title ?? "")}
                                    </span>
                                    {!viewMode ? (
                                      <span className="flex shrink-0 items-center gap-1">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 px-2"
                                          onClick={() =>
                                            setLessonDialog({
                                              open: true,
                                              moduleId: mid,
                                              lessonId: lid,
                                              title: String(lesson.title ?? ""),
                                            })
                                          }
                                        >
                                          <EditPencil className="h-4 w-4" strokeWidth={1.5} />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 px-2 text-danger hover:text-danger"
                                          onClick={() =>
                                            deleteLessonMutation.mutate(lid, {
                                              onSuccess: () => invalidateCourseLists(),
                                            })
                                          }
                                        >
                                          <Trash className="h-4 w-4" strokeWidth={1.5} />
                                        </Button>
                                      </span>
                                    ) : null}
                                  </div>
                                );
                              })
                            )}
                            {!viewMode ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-1"
                                onClick={() =>
                                  setLessonDialog({
                                    open: true,
                                    moduleId: mid,
                                    lessonId: null,
                                    title: "",
                                  })
                                }
                              >
                                <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
                                Add lesson
                              </Button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && effectiveCourseId == null && (
            <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Save <span className="font-medium text-foreground">Course details</span> first (click
              Next on that step), then you can add modules and lessons here.
            </div>
          )}

          {currentStep === 3 && effectiveCourseId != null && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Downloadable resources</h3>
                  <p className="text-sm text-muted-foreground">
                    Add files learners can download — drag a file into the drawer or pick one on disk.
                  </p>
                </div>
                {!viewMode ? (
                  <Button
                    type="button"
                    onClick={() => {
                      setResourceDraft({ title: "", file: null, existingFileUrl: null });
                      setResourceDrawerOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
                    New Resource
                  </Button>
                ) : null}
              </div>

              {resourcesRows.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                  No downloadable resources yet — click &quot;New Resource&quot; to add a file.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {resourcesRows.map((row) => {
                    const rid = Number(row.id);
                    const rtitle = String(row.title ?? "");
                    const rurl = String(row.resource_file_url ?? "");
                    return (
                      <div
                        key={rid}
                        className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                      >
                        {!viewMode ? (
                          <div className="absolute right-2 top-2 z-10 flex gap-1 rounded-md bg-card/90 p-0.5 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => {
                                setResourceDraft({
                                  id: rid,
                                  title: rtitle,
                                  file: null,
                                  existingFileUrl: rurl || null,
                                });
                                setResourceDrawerOpen(true);
                              }}
                              aria-label="Edit resource"
                            >
                              <EditPencil className="h-4 w-4" strokeWidth={1.5} />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-danger hover:text-danger"
                              onClick={() =>
                                deleteResourceMutation.mutate(rid, {
                                  onSuccess: () => invalidateCourseLists(),
                                })
                              }
                              aria-label="Delete resource"
                            >
                              <Trash className="h-4 w-4" strokeWidth={1.5} />
                            </Button>
                          </div>
                        ) : null}
                        <div className="flex items-start gap-3 pr-14">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Attachment className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">{rtitle}</p>
                            <p className="mt-1 truncate text-xs text-muted-foreground" title={rurl}>
                              {fileLabelFromUrl(rurl) || "File attached"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Drawer open={resourceDrawerOpen} onClose={() => setResourceDrawerOpen(false)}>
                <DrawerOverlay />
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>
                      {resourceDraft.id != null ? "Edit resource" : "New resource"}
                    </DrawerTitle>
                  </DrawerHeader>
                  <DrawerBody>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="resource-drawer-title">Title</Label>
                        <Input
                          id="resource-drawer-title"
                          value={resourceDraft.title}
                          onChange={(e) =>
                            setResourceDraft((d) => ({ ...d, title: e.target.value }))
                          }
                          placeholder="Resource title"
                          disabled={viewMode}
                        />
                      </div>
                      <ImageDropzone
                        accept="*/*"
                        label="File"
                        hint="Drag and drop or click to choose — PDF, ZIP, documents…"
                        value={resourceDraft.file}
                        onSelect={(file) => setResourceDraft((d) => ({ ...d, file }))}
                        previewMode="square"
                        initialPreviewUrl={
                          resourceDraft.file
                            ? null
                            : mediaUrlForPreview(resourceDraft.existingFileUrl)
                        }
                        initialPreviewName={
                          resourceDraft.file
                            ? null
                            : fileLabelFromUrl(resourceDraft.existingFileUrl) || null
                        }
                      />
                    </div>
                  </DrawerBody>
                  <DrawerFooter>
                    <Button type="button" variant="outline" onClick={() => setResourceDrawerOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      disabled={
                        createResourceMutation.isPending ||
                        updateResourceMutation.isPending ||
                        viewMode ||
                        (!resourceDraft.title.trim() &&
                          resourceDraft.id == null &&
                          resourceDraft.file == null)
                      }
                      onClick={() => {
                        const cid = effectiveCourseId;
                        if (!cid) return;
                        const title =
                          resourceDraft.title.trim() ||
                          (resourceDraft.file?.name ? resourceDraft.file.name : "Untitled");
                        if (resourceDraft.id != null) {
                          const body: Record<string, unknown> = { title };
                          if (resourceDraft.file) body.resource_file = resourceDraft.file;
                          updateResourceMutation.mutate(
                            { id: resourceDraft.id, body },
                            {
                              onSuccess: () => {
                                invalidateCourseLists();
                                setResourceDrawerOpen(false);
                                setResourceDraft({ title: "", file: null, existingFileUrl: null });
                              },
                            }
                          );
                          return;
                        }
                        if (!resourceDraft.file) return;
                        createResourceMutation.mutate(
                          {
                            course_id: cid,
                            title,
                            resource_file: resourceDraft.file,
                            uploaded_at: new Date().toISOString(),
                          },
                          {
                            onSuccess: () => {
                              invalidateCourseLists();
                              setResourceDrawerOpen(false);
                              setResourceDraft({ title: "", file: null, existingFileUrl: null });
                            },
                          }
                        );
                      }}
                    >
                      {createResourceMutation.isPending || updateResourceMutation.isPending ? (
                        <Spinner className="h-4 w-4" />
                      ) : resourceDraft.id != null ? (
                        "Save changes"
                      ) : (
                        "Add resource"
                      )}
                    </Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </div>
          )}

          {currentStep === 3 && effectiveCourseId == null && (
            <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Save <span className="font-medium text-foreground">Course details</span> first to manage
              downloadable resources.
            </div>
          )}

          {currentStep === 4 && effectiveCourseId != null && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Quiz files</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload quiz or assessment files — same flow as downloadable resources.
                  </p>
                </div>
                {!viewMode ? (
                  <Button
                    type="button"
                    onClick={() => {
                      setQuizDraft({ title: "", file: null, existingFileUrl: null });
                      setQuizDrawerOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
                    New Quiz file
                  </Button>
                ) : null}
              </div>

              {quizRowsList.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                  No quiz files yet — click &quot;New Quiz file&quot; to upload one.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {quizRowsList.map((row) => {
                    const qid = Number(row.id);
                    const qtitle = String(row.title ?? "");
                    const qurl = String(row.quiz_file_url ?? "");
                    return (
                      <div
                        key={qid}
                        className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                      >
                        {!viewMode ? (
                          <div className="absolute right-2 top-2 z-10 flex gap-1 rounded-md bg-card/90 p-0.5 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => {
                                setQuizDraft({
                                  id: qid,
                                  title: qtitle,
                                  file: null,
                                  existingFileUrl: qurl || null,
                                });
                                setQuizDrawerOpen(true);
                              }}
                              aria-label="Edit quiz file"
                            >
                              <EditPencil className="h-4 w-4" strokeWidth={1.5} />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-danger hover:text-danger"
                              onClick={() =>
                                deleteQuizMutation.mutate(qid, {
                                  onSuccess: () => invalidateCourseLists(),
                                })
                              }
                              aria-label="Delete quiz file"
                            >
                              <Trash className="h-4 w-4" strokeWidth={1.5} />
                            </Button>
                          </div>
                        ) : null}
                        <div className="flex items-start gap-3 pr-14">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Page className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">{qtitle}</p>
                            <p className="mt-1 truncate text-xs text-muted-foreground" title={qurl}>
                              {fileLabelFromUrl(qurl) || "File attached"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Drawer open={quizDrawerOpen} onClose={() => setQuizDrawerOpen(false)}>
                <DrawerOverlay />
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>
                      {quizDraft.id != null ? "Edit quiz file" : "New quiz file"}
                    </DrawerTitle>
                  </DrawerHeader>
                  <DrawerBody>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="quiz-drawer-title">Title</Label>
                        <Input
                          id="quiz-drawer-title"
                          value={quizDraft.title}
                          onChange={(e) => setQuizDraft((d) => ({ ...d, title: e.target.value }))}
                          placeholder="Quiz title"
                          disabled={viewMode}
                        />
                      </div>
                      <ImageDropzone
                        accept="*/*"
                        label="File"
                        hint="Drag and drop or click to choose a quiz file"
                        value={quizDraft.file}
                        onSelect={(file) => setQuizDraft((d) => ({ ...d, file }))}
                        previewMode="square"
                        initialPreviewUrl={
                          quizDraft.file ? null : mediaUrlForPreview(quizDraft.existingFileUrl)
                        }
                        initialPreviewName={
                          quizDraft.file
                            ? null
                            : fileLabelFromUrl(quizDraft.existingFileUrl) || null
                        }
                      />
                    </div>
                  </DrawerBody>
                  <DrawerFooter>
                    <Button type="button" variant="outline" onClick={() => setQuizDrawerOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      disabled={
                        createQuizMutation.isPending ||
                        updateQuizMutation.isPending ||
                        viewMode ||
                        (!quizDraft.title.trim() && quizDraft.id == null && quizDraft.file == null)
                      }
                      onClick={() => {
                        const cid = effectiveCourseId;
                        if (!cid) return;
                        const title =
                          quizDraft.title.trim() ||
                          (quizDraft.file?.name ? quizDraft.file.name : "Untitled");
                        if (quizDraft.id != null) {
                          const body: Record<string, unknown> = { title };
                          if (quizDraft.file) body.quiz_file = quizDraft.file;
                          updateQuizMutation.mutate(
                            { id: quizDraft.id, body },
                            {
                              onSuccess: () => {
                                invalidateCourseLists();
                                setQuizDrawerOpen(false);
                                setQuizDraft({ title: "", file: null, existingFileUrl: null });
                              },
                            }
                          );
                          return;
                        }
                        if (!quizDraft.file) return;
                        createQuizMutation.mutate(
                          {
                            course_id: cid,
                            title,
                            quiz_file: quizDraft.file,
                            uploaded_at: new Date().toISOString(),
                          },
                          {
                            onSuccess: () => {
                              invalidateCourseLists();
                              setQuizDrawerOpen(false);
                              setQuizDraft({ title: "", file: null, existingFileUrl: null });
                            },
                          }
                        );
                      }}
                    >
                      {createQuizMutation.isPending || updateQuizMutation.isPending ? (
                        <Spinner className="h-4 w-4" />
                      ) : quizDraft.id != null ? (
                        "Save changes"
                      ) : (
                        "Add quiz file"
                      )}
                    </Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </div>
          )}

          {currentStep === 4 && effectiveCourseId == null && (
            <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Save <span className="font-medium text-foreground">Course details</span> first to manage quiz
              files.
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
                <Button type="button" onClick={() => void advanceStep()}>
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

      {moduleModalOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4"
          role="presentation"
          onClick={() => setModuleModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-module-heading"
            className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
           
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="new-module-input">New module Title</Label>
              <Input
                id="new-module-input"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="e.g. Introduction"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModuleModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={
                  !newModuleTitle.trim() ||
                  createFaaslMutation.isPending ||
                  effectiveCourseId == null
                }
                onClick={() => {
                  const cid = effectiveCourseId;
                  if (!cid || !newModuleTitle.trim()) return;
                  createFaaslMutation.mutate(
                    { course_id: cid, title: newModuleTitle.trim() },
                    {
                      onSuccess: (res) => {
                        const fromEnvelope = getCourseEntityDetailFromResponse(res as unknown);
                        const fallbackId =
                          res && typeof res === "object" && res !== null && "id" in res
                            ? (res as { id?: unknown }).id
                            : undefined;
                        const nid = Number(fromEnvelope?.id ?? fallbackId ?? 0);
                        if (nid) setExpandedModules((prev) => ({ ...prev, [nid]: true }));
                        setModuleModalOpen(false);
                        setNewModuleTitle("");
                        invalidateCourseLists();
                      },
                    }
                  );
                }}
              >
                {createFaaslMutation.isPending ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {moduleRenameDialog.open ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4"
          role="presentation"
          onClick={() => setModuleRenameDialog({ open: false, id: 0, title: "" })}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-module-heading"
            className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="rename-module-heading" className="text-lg font-semibold text-foreground">
              Rename module
            </h3>
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="rename-module-input">Title</Label>
              <Input
                id="rename-module-input"
                value={moduleRenameDialog.title}
                onChange={(e) =>
                  setModuleRenameDialog((d) => ({ ...d, title: e.target.value }))
                }
                placeholder="Module title"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModuleRenameDialog({ open: false, id: 0, title: "" })}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={
                  !moduleRenameDialog.title.trim() ||
                  updateFaaslMutation.isPending
                }
                onClick={() => {
                  updateFaaslMutation.mutate(
                    {
                      id: moduleRenameDialog.id,
                      body: { title: moduleRenameDialog.title.trim() },
                    },
                    {
                      onSuccess: () => {
                        setModuleRenameDialog({ open: false, id: 0, title: "" });
                        invalidateCourseLists();
                      },
                    }
                  );
                }}
              >
                {updateFaaslMutation.isPending ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {lessonDialog.open ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4"
          role="presentation"
          onClick={() =>
            setLessonDialog({
              open: false,
              moduleId: 0,
              lessonId: null,
              title: "",
            })
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lesson-dialog-heading"
            className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="lesson-dialog-heading" className="text-lg font-semibold text-foreground">
              {lessonDialog.lessonId != null ? "Edit lesson" : "New lesson"}
            </h3>
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="lesson-title-input">Title</Label>
              <Input
                id="lesson-title-input"
                value={lessonDialog.title}
                onChange={(e) =>
                  setLessonDialog((d) => ({ ...d, title: e.target.value }))
                }
                placeholder="Lesson title"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setLessonDialog({
                    open: false,
                    moduleId: 0,
                    lessonId: null,
                    title: "",
                  })
                }
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={
                  !lessonDialog.title.trim() ||
                  createLessonMutation.isPending ||
                  updateLessonMutation.isPending ||
                  effectiveCourseId == null
                }
                onClick={() => {
                  const cid = effectiveCourseId;
                  if (!cid || !lessonDialog.title.trim()) return;
                  const title = lessonDialog.title.trim();
                  if (lessonDialog.lessonId != null) {
                    updateLessonMutation.mutate(
                      { id: lessonDialog.lessonId, body: { title } },
                      {
                        onSuccess: () => {
                          setLessonDialog({
                            open: false,
                            moduleId: 0,
                            lessonId: null,
                            title: "",
                          });
                          invalidateCourseLists();
                        },
                      }
                    );
                    return;
                  }
                  createLessonMutation.mutate(
                    {
                      course_id: cid,
                      course_module_id: lessonDialog.moduleId,
                      title,
                    },
                    {
                      onSuccess: () => {
                        setLessonDialog({
                          open: false,
                          moduleId: 0,
                          lessonId: null,
                          title: "",
                        });
                        invalidateCourseLists();
                      },
                    }
                  );
                }}
              >
                {createLessonMutation.isPending || updateLessonMutation.isPending ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CourseWizardPage;
