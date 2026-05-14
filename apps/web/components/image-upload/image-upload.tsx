"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ImageIcon, Trash, Upload } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

interface ImageUploadProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange"
  > {
  onChange: (file: File | null) => void;
  value?: File | null; // Bereits existierendes Bild als File-Objekt
  previewUrl?: string | null; // Optionaler URL-String für die Bildvorschau
}

const ImageUpload = React.forwardRef<HTMLInputElement, ImageUploadProps>(
  (
    { className, onChange, value, previewUrl: initialPreviewUrl, ...props },
    ref
  ) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Setze `previewUrl` direkt mit `initialPreviewUrl`, falls vorhanden
    const [previewUrl, setPreviewUrl] = useState<string | null>(
      initialPreviewUrl || null
    );

    useEffect(() => {
      if (value instanceof File) {
        const objectUrl = URL.createObjectURL(value);
        setPreviewUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
      }
    }, [value]); // `initialPreviewUrl` wird nicht erneut überschrieben

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] || null;
      onChange(file);
    };

    const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      fileInputRef.current?.click();
    };

    const handleRemoveImage = () => {
      setPreviewUrl(null);
      onChange(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    return (
      <div
        className={cn("grid w-full max-w-sm items-center gap-1.5", className)}
      >
        <Input
          id="picture"
          type="file"
          ref={(e) => {
            if (typeof ref === "function") {
              ref(e);
            } else if (ref) {
              ref.current = e;
            }
            fileInputRef.current = e;
          }}
          className="hidden"
          onChange={handleFileChange}
          accept="image/*"
          {...props}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleButtonClick}
            variant="outline"
            className="flex-1"
          >
            {previewUrl ? (
              <ImageIcon className="w-5 h-5 mr-2" />
            ) : (
              <Upload className="w-5 h-5 mr-2" />
            )}
            {previewUrl ? "Bild ändern" : "Bild hochladen"}
          </Button>
          {previewUrl && (
            <Button
              type="button"
              onClick={handleRemoveImage}
              variant="destructive"
              className="w-12"
              aria-label="Bild entfernen"
            >
              <Trash className="w-5 h-5" />
            </Button>
          )}
        </div>
        {previewUrl && (
          <div className="mt-4 relative">
            <Image
              src={previewUrl}
              alt="Vorschau"
              width={200}
              height={200}
              className="max-w-full max-h-64 rounded-lg shadow-md"
            />
          </div>
        )}
      </div>
    );
  }
);

ImageUpload.displayName = "ImageUpload";

export { ImageUpload };
