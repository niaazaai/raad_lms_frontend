import { useRef } from "react";
import { Label } from "@/components/ui";
import { Page, Upload, Xmark } from "iconoir-react";

export interface MultiImageDropzoneProps {
  accept: string;
  label: string;
  hint: string;
  maxFiles: number;
  value: File[];
  onSelect: (files: File[]) => void;
  error?: string;
}

const MultiImageDropzone = ({
  accept,
  label,
  hint,
  maxFiles,
  value,
  onSelect,
  error,
}: MultiImageDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    onSelect([...value, ...files].slice(0, maxFiles));
    e.target.value = "";
  };

  const removeAt = (idx: number) => {
    onSelect(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={handleChange}
        disabled={value.length >= maxFiles}
      />
      <div className="flex flex-wrap gap-3">
        {value.map((file, idx) => (
          <div key={idx} className="relative">
            {file.type === "application/pdf" ? (
              <div className="flex h-20 w-20 flex-col items-center justify-center gap-0.5 rounded-lg border border-border bg-muted/30">
                <Page className="h-6 w-6 text-muted-foreground" />
                <span className="text-[10px] text-foreground truncate max-w-full px-1">
                  {file.name}
                </span>
              </div>
            ) : (
              <img
                src={URL.createObjectURL(file)}
                alt={`File ${idx + 1}`}
                className="h-20 w-20 rounded-lg border border-border object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white"
            >
              <Xmark className="h-3 w-3" />
            </button>
          </div>
        ))}
        {value.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/30"
          >
            <Upload className="h-6 w-6" />
            <span className="mt-0.5 text-[10px]">Add</span>
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
};

export default MultiImageDropzone;
