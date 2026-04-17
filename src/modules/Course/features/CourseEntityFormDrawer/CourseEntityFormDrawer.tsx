import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { CourseEntitySlug } from "../../data/courseRegistry";
import {
  COURSE_ENTITY_FORM_REGISTRY,
  courseRowToFormValues,
  getCreateDefaultsForEntity,
  serializeCourseEntityPayload,
} from "../../data/courseEntityFormRegistry";
import {
  getCourseEntityDetailFromResponse,
  useCourseEntityDetail,
  useCreateCourseEntity,
  useUpdateCourseEntity,
} from "../../hooks/useCourseEntity";
import {
  Button,
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui";
import { cn } from "@/lib/utils";

type FormValues = Record<string, string | boolean>;

export type CourseEntityDrawerMode = "create" | "edit" | "view";

export interface CourseEntityFormDrawerProps {
  slug: CourseEntitySlug;
  entityTitle: string;
  mode: CourseEntityDrawerMode;
  entityId: number | null;
  onSuccess: () => void;
}

const inputClass = cn(
  "border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm",
  "focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
);

function validateRequired(
  values: FormValues,
  slug: CourseEntitySlug
): string | null {
  const def = COURSE_ENTITY_FORM_REGISTRY[slug];
  for (const f of def.fields) {
    if (!f.required) continue;
    const v = values[f.name];
    if (f.type === "checkbox") continue;
    if (v === undefined || v === null || String(v).trim() === "") {
      return `${f.label} is required`;
    }
  }
  return null;
}

const CourseEntityFormDrawer = ({
  slug,
  entityTitle,
  mode,
  entityId,
  onSuccess,
}: CourseEntityFormDrawerProps) => {
  const def = COURSE_ENTITY_FORM_REGISTRY[slug];
  const readOnly = mode === "view";

  const { data: detailRes, isLoading: loadingDetail } = useCourseEntityDetail(
    slug,
    entityId,
    { enabled: mode !== "create" && entityId != null }
  );
  const detail = getCourseEntityDetailFromResponse(detailRes);

  const { mutate: createEntity, isPending: creating } = useCreateCourseEntity(slug);
  const { mutate: updateEntity, isPending: updating } = useUpdateCourseEntity(slug);
  const submitting = creating || updating;

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {},
  });

  useEffect(() => {
    const fields = COURSE_ENTITY_FORM_REGISTRY[slug].fields;
    if (mode === "create") {
      reset(getCreateDefaultsForEntity(slug));
      return;
    }
    if (detail) {
      reset(courseRowToFormValues(detail, fields));
    }
  }, [mode, slug, detail, reset]);

  const onSubmit = (values: FormValues) => {
    if (readOnly) return;
    const err = validateRequired(values, slug);
    if (err) {
      toast.error(err);
      return;
    }
    const payload = serializeCourseEntityPayload(values, def.fields);

    if (mode === "create") {
      createEntity(payload, {
        onSuccess: () => {
          toast.success("Created successfully");
          onSuccess();
        },
        onError: (e: unknown) =>
          toast.error(e instanceof Error ? e.message : "Create failed"),
      });
      return;
    }

    if (entityId == null) return;
    updateEntity(
      { id: entityId, body: payload },
      {
        onSuccess: () => {
          toast.success("Updated successfully");
          onSuccess();
        },
        onError: (e: unknown) =>
          toast.error(e instanceof Error ? e.message : "Update failed"),
      }
    );
  };

  const heading =
    mode === "create" ? `Create ${entityTitle}` : mode === "edit" ? `Edit ${entityTitle}` : `View ${entityTitle}`;

  if (mode !== "create" && entityId != null && loadingDetail && !detail) {
    return (
      <>
        <DrawerHeader>
          <DrawerTitle>{heading}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
          </div>
        </DrawerBody>
      </>
    );
  }

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{heading}</DrawerTitle>
        <DrawerDescription>
          {readOnly
            ? "Read-only details from the API."
            : mode === "create"
              ? "Fill in the fields and save. IDs reference other records in the LMS."
              : "Update fields and save changes."}
        </DrawerDescription>
      </DrawerHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DrawerBody className="space-y-4">
          {def.fields.map((f) => {
            const id = `cef-${f.name}`;
            return (
              <div key={f.name} className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor={id}>
                  {f.label}
                  {f.required ? <span className="text-destructive"> *</span> : null}
                </label>
                {f.type === "textarea" ? (
                  <textarea
                    id={id}
                    className={cn(inputClass, "min-h-[88px]")}
                    disabled={readOnly}
                    placeholder={f.placeholder}
                    {...register(f.name)}
                  />
                ) : null}
                {f.type === "json" ? (
                  <textarea
                    id={id}
                    className={cn(inputClass, "min-h-[120px] font-mono text-xs")}
                    disabled={readOnly}
                    placeholder={f.placeholder}
                    {...register(f.name)}
                  />
                ) : null}
                {f.type === "text" || f.type === "number" ? (
                  <input
                    id={id}
                    type={f.type === "number" ? "number" : "text"}
                    step={f.type === "number" ? "any" : undefined}
                    className={inputClass}
                    disabled={readOnly}
                    placeholder={f.placeholder}
                    {...register(f.name)}
                  />
                ) : null}
                {f.type === "date" ? (
                  <input id={id} type="date" className={inputClass} disabled={readOnly} {...register(f.name)} />
                ) : null}
                {f.type === "select" ? (
                  <select id={id} className={inputClass} disabled={readOnly} {...register(f.name)}>
                    <option value="">—</option>
                    {(f.options ?? []).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : null}
                {f.type === "checkbox" ? (
                  <input
                    id={id}
                    type="checkbox"
                    disabled={readOnly}
                    className="border-input h-4 w-4 rounded"
                    {...register(f.name)}
                  />
                ) : null}
              </div>
            );
          })}
        </DrawerBody>

        {!readOnly && (
          <DrawerFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </DrawerFooter>
        )}
      </form>
    </>
  );
};

export default CourseEntityFormDrawer;
