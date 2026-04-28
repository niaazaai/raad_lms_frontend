import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Circle, Book, Folder, PageEdit, Play, Attachment, Page } from "iconoir-react";
import { Button, Input, Label, Stepper } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import { getCourseEntityDetailFromResponse, useCourseEntityDetail, useCourseEntityList, useCreateCourseEntity, useUpdateCourseEntity } from "../../hooks/useCourseEntity";

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

const steps = [
  { id: "category", title: "Select Category", icon: <Folder className="h-4 w-4" /> },
  { id: "details", title: "Course Details", icon: <PageEdit className="h-4 w-4" /> },
  { id: "modules", title: "Course Modules", icon: <Book className="h-4 w-4" /> },
  { id: "lessons", title: "Lessons", icon: <Play className="h-4 w-4" /> },
  { id: "resources", title: "Downloadables", icon: <Attachment className="h-4 w-4" /> },
  { id: "quiz", title: "Quiz Files", icon: <Page className="h-4 w-4" /> },
];

const CourseWizardPage = () => {
  const textAreaClassName =
    "border-input bg-background min-h-[88px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none";

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
    resolver: zodResolver(schema),
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
  const allSub = (subCategoriesQuery.data as { data?: Array<Record<string, unknown>> } | undefined)?.data ?? [];
  const filteredSubCategories = allSub.filter((row) => Number(row.main_category_id) === Number(selectedMain));

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
      updateMutation.mutate({ id: editId, body: payload }, { onSuccess: () => navigate("/course/courses") });
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

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-border p-4">
          <h2 className="mb-3 text-sm font-semibold">Course creation flow</h2>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(index)}
                className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm ${currentStep === index ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
              >
                {stepState[index] ? <CheckCircle className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4" />}
                <span>{step.title}</span>
              </button>
            ))}
          </div>
          <Stepper steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} className="mt-4" />
        </aside>

        <section className="rounded-lg border border-border p-5 space-y-5">
          {currentStep === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Main category</Label>
                <select
                  className="border-input h-9 w-full rounded-md border bg-background px-3 text-sm"
                  {...register("course_main_category_id")}
                  disabled={viewMode}
                >
                  <option value="">Select main category</option>
                  {((mainCategoriesQuery.data as { data?: Array<Record<string, unknown>> } | undefined)?.data ?? []).map((row) => (
                    <option key={String(row.id)} value={Number(row.id)}>
                      {String(row.title ?? "")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Sub category</Label>
                <select
                  className="border-input h-9 w-full rounded-md border bg-background px-3 text-sm"
                  {...register("course_sub_category_id")}
                  disabled={viewMode || !selectedMain}
                >
                  <option value="">Select sub category</option>
                  {filteredSubCategories.map((row) => (
                    <option key={String(row.id)} value={Number(row.id)}>
                      {String(row.title ?? "")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2"><Label>Title</Label><Input {...register("title")} disabled={viewMode} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Short description</Label><textarea className={textAreaClassName} {...register("short_description")} disabled={viewMode} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Long description</Label><textarea className={textAreaClassName} {...register("long_description")} disabled={viewMode} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Prerequisites</Label><textarea className={textAreaClassName} {...register("prerequisites")} disabled={viewMode} /></div>
              <div className="space-y-1.5"><Label>Language</Label><Input {...register("language")} disabled={viewMode} /></div>
              <div className="space-y-1.5"><Label>Level</Label><Input {...register("level")} disabled={viewMode} /></div>
              <div className="space-y-1.5"><Label>Thumbnail</Label><Input {...register("thumbnail")} disabled={viewMode} /></div>
              <div className="space-y-1.5"><Label>Banner</Label><Input {...register("banner")} disabled={viewMode} /></div>
              <div className="space-y-1.5"><Label>Price</Label><Input type="number" {...register("price")} disabled={viewMode} /></div>
              <div className="space-y-1.5"><Label>Instructor</Label>
                <select className="border-input h-9 w-full rounded-md border bg-background px-3 text-sm" {...register("instructor_id")} disabled={viewMode}>
                  <option value="">Select instructor</option>
                  {((instructorsQuery.data as { data?: Array<Record<string, unknown>> } | undefined)?.data ?? []).map((row) => (
                    <option key={String(row.id)} value={Number(row.user_id ?? row.id)}>
                      {String(row.user_name ?? row.specialization ?? `Instructor #${row.id}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5"><Label>Course duration (min)</Label><Input type="number" {...register("estimated_duration")} disabled={viewMode} /></div>
              <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                {["is_featured", "is_popular", "is_new", "is_best_seller", "is_free"].map((key) => (
                  <label key={key} className="flex items-center gap-2">
                    <input type="checkbox" {...register(key as keyof FormData)} disabled={viewMode} />
                    <span>{key.replace("is_", "").replace("_", " ")}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-1.5">
              <Label>Course module (Faasl)</Label>
              <select className="border-input h-9 w-full rounded-md border bg-background px-3 text-sm" {...register("course_module_id")} disabled={viewMode}>
                <option value="">Select module</option>
                {((modulesQuery.data as { data?: Array<Record<string, unknown>> } | undefined)?.data ?? []).map((row) => (
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
                {!viewMode && <Button type="button" size="sm" onClick={() => lessonsField.append({ title: "", description: "" })}>Add lesson</Button>}
              </div>
              {lessonsField.fields.map((field, idx) => (
                <div key={field.id} className="rounded-md border border-border p-3 space-y-2">
                  <Input placeholder="Lesson title" {...register(`lessons.${idx}.title`)} disabled={viewMode} />
                  <textarea className={textAreaClassName} placeholder="Lesson description" {...register(`lessons.${idx}.description`)} disabled={viewMode} />
                  <div className="space-y-1">
                    <Label>Lesson video</Label>
                    <input
                      type="file"
                      accept="video/*"
                      disabled={viewMode}
                      onChange={() => simulateVideoUpload(`lesson-${idx}`)}
                    />
                    {videoProgress[`lesson-${idx}`] !== undefined && (
                      <div className="h-2 rounded bg-muted">
                        <div className="h-2 rounded bg-primary" style={{ width: `${videoProgress[`lesson-${idx}`]}%` }} />
                      </div>
                    )}
                  </div>
                  {!viewMode && (
                    <Button type="button" variant="outline" size="sm" onClick={() => lessonsField.remove(idx)}>
                      Remove lesson
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <h3 className="font-medium">Downloadable resources</h3>
                {!viewMode && <Button type="button" size="sm" onClick={() => resourcesField.append({ title: "" })}>Add file</Button>}
              </div>
              {resourcesField.fields.map((field, idx) => (
                <div key={field.id} className="rounded-md border border-border p-3 space-y-2">
                  <Input placeholder="Optional title" {...register(`downloadable_resources.${idx}.title`)} disabled={viewMode} />
                  <input type="file" disabled={viewMode} />
                  {!viewMode && <Button type="button" variant="outline" size="sm" onClick={() => resourcesField.remove(idx)}>Remove</Button>}
                </div>
              ))}
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <h3 className="font-medium">Quiz files</h3>
                {!viewMode && <Button type="button" size="sm" onClick={() => quizField.append({ title: "" })}>Add file</Button>}
              </div>
              {quizField.fields.map((field, idx) => (
                <div key={field.id} className="rounded-md border border-border p-3 space-y-2">
                  <Input placeholder="Optional title" {...register(`quiz_files.${idx}.title`)} disabled={viewMode} />
                  <input type="file" disabled={viewMode} />
                  {!viewMode && <Button type="button" variant="outline" size="sm" onClick={() => quizField.remove(idx)}>Remove</Button>}
                </div>
              ))}
            </div>
          )}

          {!viewMode && formState.errors.title && <p className="text-sm text-danger">{formState.errors.title.message}</p>}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}>
              Previous
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => navigate("/course/courses")}>Cancel</Button>
              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={() => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? <Spinner className="h-4 w-4" /> : "Save course"}
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
