import { useState, useRef, useCallback } from "react";
import { Label } from "@/components/ui";
import { Image as ImageIcon, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageDropzoneProps {
  accept: string;
  label: string;
  hint: string;
  required?: boolean;
  error?: string;
  value?: File | null;
  onSelect: (file: File | null) => void;
  previewMode?: "square" | "wide";
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
}: ImageDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

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
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors cursor-pointer",
          previewMode === "wide" && "py-8",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30",
          error && "border-danger"
        )}
      >
        {value ? (
          <div className="relative">
            {value.type === "application/pdf" ? (
              <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground truncate max-w-[140px]">
                  {value.name}
                </span>
              </div>
            ) : (
              <img
                src={URL.createObjectURL(value)}
                alt="Preview"
                className={cn(
                  "object-cover border border-border rounded-lg",
                  previewMode === "square" ? "h-24 w-24" : "h-20 w-full max-w-[240px]"
                )}
              />
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSelect(null); }}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white hover:bg-danger-active"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
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
