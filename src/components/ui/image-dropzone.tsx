import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { Label } from "@/components/ui";
import { MediaImage, Page, Play, Xmark } from "iconoir-react";
import { cn } from "@/lib/utils";

export type ImageDropzoneMediaPreview = "image" | "video" | "file";

export interface ImageDropzoneProps {
  accept: string;
  label: string;
  hint: string;
  required?: boolean;
  error?: string;
  value?: File | null;
  onSelect: (file: File | null) => void;
  previewMode?: "square" | "wide";
  /** Use `video` for lesson uploads — shows &lt;video&gt; preview instead of &lt;img&gt;. */
  mediaPreview?: ImageDropzoneMediaPreview;
  initialPreviewUrl?: string | null;
  initialPreviewName?: string | null;
}

const ImageDropzone = ({
  accept,
  label,
  hint,
  required,
  error,
  value,
  onSelect,
  previewMode = "square",
  mediaPreview = "image",
  initialPreviewUrl,
  initialPreviewName,
}: ImageDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [remotePreviewFailed, setRemotePreviewFailed] = useState(false);

  useEffect(() => {
    setRemotePreviewFailed(false);
  }, [initialPreviewUrl, value]);

  useLayoutEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return undefined;
    }
    if (value.type === "application/pdf") {
      setPreviewUrl(null);
      return undefined;
    }
    if (mediaPreview === "video") {
      if (!value.type.startsWith("video/")) {
        setPreviewUrl(null);
        return undefined;
      }
    } else {
      // image (default) or "file" voucher: preview images only; PDF handled above
      if (!value.type.startsWith("image/")) {
        setPreviewUrl(null);
        return undefined;
      }
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value, mediaPreview]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onSelect(file);
    },
    [onSelect]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelect(e.target.files?.[0] ?? null);
  };

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </Label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
        aria-invalid={!!error}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors cursor-pointer",
          previewMode === "wide" && "py-8",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          error && "border-danger"
        )}
      >
        {value || (initialPreviewUrl && !remotePreviewFailed) ? (
          <div className="relative">
            {value && value.type === "application/pdf" ? (
              <div className="flex w-full max-w-md flex-col items-center gap-2 rounded-xl border border-border bg-muted/30 px-6 py-6">
                <Page className="h-14 w-14 text-primary" />
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  PDF voucher
                </p>
                <span className="max-w-full truncate text-center text-sm font-medium text-foreground">
                  {value.name || initialPreviewName || "document.pdf"}
                </span>
                <span className="text-center text-xs text-muted-foreground">
                  {(value.size / 1024).toFixed(1)} KB · tap the dropzone to replace
                </span>
              </div>
            ) : value && previewUrl && mediaPreview === "video" ? (
              <video
                src={previewUrl}
                controls
                muted
                className={cn(
                  "max-h-36 rounded-lg border border-border bg-black object-contain",
                  previewMode === "wide" ? "w-full max-w-[280px]" : "w-full max-w-[240px]"
                )}
              />
            ) : value && previewUrl ? (
              <img
                src={previewUrl}
                alt="Voucher preview"
                className={cn(
                  "max-h-64 w-full max-w-md rounded-lg border border-border bg-muted/20 object-contain",
                  previewMode === "square" && "h-24 w-24 max-h-24 max-w-24 object-cover"
                )}
              />
            ) : initialPreviewUrl && !remotePreviewFailed && mediaPreview === "video" ? (
              <video
                src={initialPreviewUrl}
                controls
                muted
                className={cn(
                  "max-h-36 rounded-lg border border-border bg-black object-contain",
                  previewMode === "wide" ? "w-full max-w-[280px]" : "w-full max-w-[240px]"
                )}
                onError={() => setRemotePreviewFailed(true)}
              />
            ) : initialPreviewUrl && !remotePreviewFailed ? (
              <img
                src={initialPreviewUrl}
                alt="Preview"
                onError={() => setRemotePreviewFailed(true)}
                className={cn(
                  "object-cover border border-border rounded-lg",
                  previewMode === "square" ? "h-24 w-24" : "h-20 w-full max-w-[240px]"
                )}
              />
            ) : null}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white hover:bg-danger-active"
            >
              <Xmark className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            {mediaPreview === "video" ? (
              <Play className="h-10 w-10 text-muted-foreground" />
            ) : (
              <MediaImage className="h-10 w-10 text-muted-foreground" />
            )}
            <p className="mt-2 text-sm font-medium text-foreground">Click or drag to upload</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          </>
        )}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
};

export default ImageDropzone;
