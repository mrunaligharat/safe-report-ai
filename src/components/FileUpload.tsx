import { useRef, useState } from "react";
import { FileAudio, FileVideo, ImageIcon, Trash2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export type PendingFile = {
  id: string;
  file: File;
  preview: string | null;
  progress: number;
};

const iconFor = (type: string) => {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.startsWith("video/")) return FileVideo;
  return FileAudio;
};

export function FileUpload({
  files,
  onAdd,
  onRemove,
  disabled,
}: {
  files: PendingFile[];
  onAdd: (files: FileList | null) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onAdd(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-card px-6 py-12 text-center transition-colors",
          dragging && "border-primary bg-accent",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <span className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <UploadCloud className="h-6 w-6" />
        </span>
        <p className="font-display text-base font-semibold">Drag and drop your evidence</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Images, videos and audio files up to 50 MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*"
          className="hidden"
          onChange={(e) => {
            onAdd(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 ? (
        <ul className="space-y-3">
          {files.map((item) => {
            const Icon = iconFor(item.file.type);
            return (
              <li
                key={item.id}
                className="flex items-center gap-4 rounded-2xl bg-card p-3 shadow-soft"
              >
                {item.preview ? (
                  <img
                    src={item.preview}
                    alt={item.file.name}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {item.progress > 0 ? <Progress value={item.progress} className="mt-2 h-1.5" /> : null}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${item.file.name}`}
                  onClick={() => onRemove(item.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}