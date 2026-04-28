import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { FloppyDisk } from "iconoir-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import type { CourseEntitySlug } from "../../data/courseRegistry";
import {
  COURSE_ENTITY_FORM_REGISTRY,
  courseRowToFormValuesForSlug,
  getCreateDefaultsForEntity,
  getSerializeFieldsForSlug,
  serializeCourseEntityPayload,
} from "../../data/courseEntityFormRegistry";
import type { CourseEntityFormField } from "../../data/courseEntityFormRegistry";
import {
  getCourseEntityDetailFromResponse,
  useCourseEntityDetail,
  useCreateCourseEntity,
  useUpdateCourseEntity,
} from "../../hooks/useCourseEntity";
import { useCourseFormMeta } from "../../hooks/useCourseFormMeta";
import {
  Button,
  DrawerBody,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  ImageDropzone,
  SearchableSelect,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { API_V1_BASE } from "@/services/apiClient";

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

function validateRequired(values: FormValues, slug: CourseEntitySlug): string | null {
  const fields = getSerializeFieldsForSlug(slug);
  for (const f of fields) {
    if (!f.required) continue;
    const v = values[f.name];
    if (f.type === "checkbox") continue;
    if (v === undefined || v === null || String(v).trim() === "") {
      return `${f.label} is required`;
    }
  }
  return null;
}

function renderFieldControl(
  f: CourseEntityFormField,
  readOnly: boolean,
  register: ReturnType<typeof useForm<FormValues>>["register"]
) {
  const id = `cef-${f.name}`;
  if (f.type === "textarea") {
    return (
      <textarea
        id={id}
        className={cn(inputClass, "min-h-[88px]")}
        disabled={readOnly}
        placeholder={f.placeholder}
        {...register(f.name)}
      />
    );
  }
  if (f.type === "json") {
    return (
      <textarea
        id={id}
        className={cn(inputClass, "min-h-[120px] font-mono text-xs")}
        disabled={readOnly}
        placeholder={f.placeholder}
        {...register(f.name)}
      />
    );
  }
  if (f.type === "text" || f.type === "number") {
    return (
      <input
        id={id}
        type={f.type === "number" ? "number" : "text"}
        step={f.type === "number" ? "any" : undefined}
        className={inputClass}
        disabled={readOnly}
        placeholder={f.placeholder}
        {...register(f.name)}
      />
    );
  }
  if (f.type === "date") {
    return (
      <input id={id} type="date" className={inputClass} disabled={readOnly} {...register(f.name)} />
    );
  }
  if (f.type === "select") {
    return (
      <select id={id} className={inputClass} disabled={readOnly} {...register(f.name)}>
        <option value="">—</option>
        {(f.options ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (f.type === "checkbox") {
    return (
      <input
        id={id}
        type="checkbox"
        disabled={readOnly}
        className="border-input h-4 w-4 rounded"
        {...register(f.name)}
      />
    );
  }
  return null;
}

const THUMB_SLUGS: CourseEntitySlug[] = ["main-categories", "sub-categories"];

function courseEntityThumbnailUrl(slug: CourseEntitySlug, entityId: number | null): string | null {
  if (entityId == null) return null;
  if (slug === "main-categories") return `${API_V1_BASE}/main-categories/${entityId}/thumbnail`;
  if (slug === "sub-categories") return `${API_V1_BASE}/sub-categories/${entityId}/thumbnail`;
  return null;
}

function CategoryDrawerViewImage({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
        No image uploaded
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={title}
      className="max-h-80 w-full object-contain"
      onError={() => setFailed(true)}
    />
  );
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
  const needsMeta = slug === "sub-categories";
  const { data: metaRes, isLoading: metaLoading } = useCourseFormMeta(
    needsMeta ? "sub-categories" : null
  );
  const meta = metaRes?.data;
  const mainCategoryOptions = useMemo(() => {
    const rows = meta?.main_categories ?? [];
    return rows.map((r) => ({ value: String(r.id), label: `${r.title} (#${r.id})` }));
  }, [meta]);

  const { data: detailRes, isLoading: loadingDetail } = useCourseEntityDetail(slug, entityId, {
    enabled: mode !== "create" && entityId != null,
  });
  const detail = getCourseEntityDetailFromResponse(detailRes);

  const { mutate: createEntity, isPending: creating } = useCreateCourseEntity(slug);
  const { mutate: updateEntity, isPending: updating } = useUpdateCourseEntity(slug);
  const submitting = creating || updating;

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, control } = useForm<FormValues>({
    defaultValues: getCreateDefaultsForEntity(slug),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  useEffect(() => {
    if (mode === "create") {
      reset(getCreateDefaultsForEntity(slug));
      setThumbnailFile(null);
      return;
    }
    if (detail) {
      reset(courseRowToFormValuesForSlug(slug, detail, def.fields));
      setThumbnailFile(null);
    }
  }, [mode, slug, detail, reset, def.fields]);

  const onSubmit = (values: FormValues) => {
    if (readOnly) return;
    const err = validateRequired(values, slug);
    if (err) {
      toast.error(err);
      return;
    }
    const fields = getSerializeFieldsForSlug(slug);
    const payload = serializeCourseEntityPayload(values, fields);
    if (THUMB_SLUGS.includes(slug) && thumbnailFile) {
      payload.thumbnail_file = thumbnailFile;
    }

    if (mode === "create") {
      createEntity(payload, {
        onSuccess: () => onSuccess(),
        onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Create failed"),
      });
      return;
    }

    if (entityId == null) return;
    updateEntity(
      { id: entityId, body: payload },
      {
        onSuccess: () => onSuccess(),
        onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Update failed"),
      }
    );
  };

  const heading =
    mode === "create"
      ? `Create ${entityTitle}`
      : mode === "edit"
        ? `Edit ${entityTitle}`
        : `View ${entityTitle}`;

  const thumbnailSrc =
    THUMB_SLUGS.includes(slug) && entityId != null
      ? courseEntityThumbnailUrl(slug, entityId)
      : null;

  if (mode !== "create" && entityId != null && loadingDetail && !detail) {
    return (
      <>
        <DrawerHeader>
          <DrawerTitle>{heading}</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <div className="flex min-h-[200px] items-center justify-center">
            <Spinner className="text-primary h-8 w-8" />
          </div>
        </DrawerBody>
      </>
    );
  }

  const showThumb = THUMB_SLUGS.includes(slug) && !readOnly;

  const renderStandardFields = (fields: CourseEntityFormField[]) =>
    fields.map((f) => {
      const id = `cef-${f.name}`;
      return (
        <div key={f.name} className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor={id}>
            {f.label}
            {f.required ? <span className="text-destructive"> *</span> : null}
          </label>
          {renderFieldControl(f, readOnly, register)}
        </div>
      );
    });

  const renderCategoryReadOnly = () => {
    if (!detail) return null;
    const title = String(detail.title ?? "—");
    const description =
      detail.description != null && String(detail.description).trim() !== ""
        ? String(detail.description)
        : "—";
    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Title</p>
          <p className="text-lg font-semibold text-foreground">{title}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Description
          </p>
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {description}
          </p>
        </div>
        {thumbnailSrc ? (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Image
            </p>
            <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
              <CategoryDrawerViewImage key={entityId ?? 0} src={thumbnailSrc} title={title} />
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{heading}</DrawerTitle>
        <DrawerDescription>
          {readOnly
            ? "Tidy entity overview."
            : mode === "create"
              ? "Fill in the fields and save. IDs reference other records in the LMS."
              : "Update fields and save changes."}
        </DrawerDescription>
      </DrawerHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DrawerBody className="space-y-4">
          {readOnly && (slug === "main-categories" || slug === "sub-categories")
            ? renderCategoryReadOnly()
            : null}
          {readOnly && slug !== "main-categories" && slug !== "sub-categories" ? (
            <div className="space-y-4">{renderStandardFields(def.fields)}</div>
          ) : null}

          {slug === "main-categories" && (
            <>
              {!readOnly
                ? renderStandardFields(def.fields.filter((f) => f.name !== "status"))
                : null}
              {showThumb ? (
                <ImageDropzone
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  label="Thumbnail"
                  hint="JPEG, PNG, WebP or GIF · stored privately under course/thumbnails"
                  value={thumbnailFile}
                  onSelect={setThumbnailFile}
                  previewMode="wide"
                  initialPreviewUrl={thumbnailFile ? null : thumbnailSrc}
                />
              ) : null}
              {!readOnly
                ? renderStandardFields(def.fields.filter((f) => f.name === "status"))
                : null}
            </>
          )}

          {slug === "sub-categories" && (
            <>
              {!readOnly && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="main_category_id"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        id="cef-main-category"
                        label="Main category"
                        required
                        options={mainCategoryOptions}
                        value={String(field.value ?? "")}
                        onChange={field.onChange}
                        placeholder="Search and select…"
                        disabled={metaLoading}
                      />
                    )}
                  />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" htmlFor="cef-status-sub">
                      Status<span className="text-destructive"> *</span>
                    </label>
                    <select id="cef-status-sub" className={inputClass} {...register("status")}>
                      <option value="">—</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              )}
              {!readOnly ? renderStandardFields(def.fields) : null}
              {showThumb ? (
                <ImageDropzone
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  label="Thumbnail"
                  hint="JPEG, PNG, WebP or GIF · stored privately under course/thumbnails"
                  value={thumbnailFile}
                  onSelect={setThumbnailFile}
                  previewMode="wide"
                  initialPreviewUrl={thumbnailFile ? null : thumbnailSrc}
                />
              ) : null}
            </>
          )}

          {slug !== "main-categories" &&
            slug !== "sub-categories" &&
            !readOnly &&
            renderStandardFields(def.fields)}
        </DrawerBody>

        {!readOnly && (
          <DrawerFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving…
                </>
              ) : (
                <>
                  <FloppyDisk className="mr-2 h-4 w-4" />
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
