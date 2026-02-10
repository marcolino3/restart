"use client";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useController, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import Image from "next/image";
import { BACKEND_PUBLIC_URL } from "@/constants/backend-public-url";
import { API_URL } from "@/constants/api-url";
import { TrashIcon } from "lucide-react";

interface Props {
  name: string;
  label?: string;
  entity: string;
  id: string;
  className?: string;
  width?: string;
  allowDelete?: boolean;
}

export const UploadFormField = ({
  name,
  label,
  entity,
  id,
  className,
  width = "w-full",
  allowDelete = true,
}: Props) => {
  const t = useTranslations("Common");
  const { control } = useFormContext();
  const { field } = useController({ name, control });

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(field.value || "");

  useEffect(() => {
    if (!field.value) {
      const imageUrl = `${BACKEND_PUBLIC_URL}/${entity}/${id}.webp`;
      fetch(imageUrl, { method: "HEAD" }).then((res) => {
        if (res.ok) {
          const urlWithTimestamp = `${imageUrl}?t=${Date.now()}`;
          setPreview(urlWithTimestamp);
          field.onChange(urlWithTimestamp);
        }
      });
    } else {
      setPreview(field.value);
    }
  }, [field, entity, id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/upload?entity=${entity}&id=${id}`, {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    setUploading(false);

    if (res.ok && result?.url) {
      const fullUrl = `${BACKEND_PUBLIC_URL}${result.url}?t=${Date.now()}`;
      field.onChange(fullUrl);
      setPreview(fullUrl);
    } else {
      alert(result?.error || "Fehler beim Hochladen");
    }
  };

  const handleDelete = async () => {
    // optional: DELETE request an API zum Löschen
    await fetch(`${API_URL}/upload?entity=${entity}&id=${id}`, {
      method: "DELETE",
    });

    field.onChange(""); // Wert im Formular zurücksetzen
    setPreview(""); // Vorschau leeren
  };

  return (
    <FormField
      name={name}
      control={control}
      render={() => (
        <FormItem className={cn(className, width)}>
          {label && <FormLabel>{t(label)}</FormLabel>}

          <FormControl>
            <Input type="file" accept="image/*" onChange={handleFileChange} />
          </FormControl>

          {uploading && (
            <p className="text-sm text-muted-foreground mt-1">
              Wird hochgeladen...
            </p>
          )}

          {preview && (
            <div className="mt-2 space-y-2">
              <Image
                key={preview}
                src={preview}
                alt="Vorschau"
                className="h-24 rounded border shadow"
                width={300}
                height={200}
              />
              {allowDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  className="mt-2"
                  onClick={handleDelete}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          <FormMessage />
        </FormItem>
      )}
    />
  );
};
