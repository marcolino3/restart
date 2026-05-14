'use client';

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useController, useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { BACKEND_PUBLIC_URL } from '@/constants/backend-public-url';
import { API_URL } from '@/constants/api-url';
import { SPACES_CDN_URL } from '@/constants/spaces-cdn-url';
import { FileText, TrashIcon } from 'lucide-react';
import { AspectRatio } from '../ui/aspect-ratio';

type FileType = 'image' | 'pdf';

interface Props {
  name: string;
  label?: string;
  description?: string;
  id: string;
  suffix?: string;
  entity?: string;
  aspectRatio?: number;
  className?: string;
  width?: string;
  allowDelete?: boolean;
  fileType?: FileType;
  useProxy?: boolean; // Use frontend API proxy for cross-domain auth
}

export const UploadFormField = ({
  name,
  label,
  description,
  id,
  suffix = '',
  entity,
  aspectRatio,
  className,
  width = 'w-full',
  allowDelete = true,
  fileType = 'image',
  useProxy = false,
}: Props) => {
  // Combine id with suffix for unique file naming
  const fileId = `${id}${suffix}`;
  const t = useTranslations('Common');
  const { control } = useFormContext();
  const { field } = useController({ name, control });

  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isImage = fileType === 'image';
  const isPdf = fileType === 'pdf';
  const fileExtension = isImage ? 'webp' : 'pdf';
  const folder = isImage ? 'images' : 'pdfs';
  const acceptType = isImage ? 'image/*' : 'application/pdf';
  const endpoint = isImage ? 'image' : 'pdf';

  // Resolve a URL to an absolute URL — handles relative paths from the DB
  const resolveUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // Remove trailing slash from base and ensure path starts with /
    const base = BACKEND_PUBLIC_URL.replace(/\/+$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  };

  // On mount: resolve relative URLs from DB to absolute, or discover file if no value
  useEffect(() => {
    if (field.value) {
      // If the value is a relative URL (from DB), resolve it to absolute
      if (!field.value.startsWith('http://') && !field.value.startsWith('https://')) {
        const spacesUrl = `${SPACES_CDN_URL}/${folder}/${fileId}.${fileExtension}`;

        // Check if file exists on Spaces CDN first
        fetch(spacesUrl, { method: 'HEAD' })
          .then((res) => {
            if (res.ok) {
              field.onChange(`${spacesUrl}?t=${Date.now()}`);
            } else {
              // Fall back to resolved backend URL
              field.onChange(`${resolveUrl(field.value)}?t=${Date.now()}`);
            }
          })
          .catch(() => {
            field.onChange(`${resolveUrl(field.value)}?t=${Date.now()}`);
          });
      }
    } else {
      // No value — try to discover existing file
      const spacesUrl = `${SPACES_CDN_URL}/${folder}/${fileId}.${fileExtension}`;
      const base = BACKEND_PUBLIC_URL.replace(/\/+$/, '');
      const localUrl = `${base}/public/${folder}/${fileId}.${fileExtension}`;

      fetch(spacesUrl, { method: 'HEAD' })
        .then((res) => {
          if (res.ok) {
            field.onChange(`${spacesUrl}?t=${Date.now()}`);
          } else {
            return fetch(localUrl, { method: 'HEAD' });
          }
        })
        .then((res) => {
          if (res?.ok) {
            field.onChange(`${localUrl}?t=${Date.now()}`);
          }
        })
        .catch(() => {
          // Ignore errors - file may not exist yet
        });
    }
  }, [fileId, folder, fileExtension]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    // Use proxy route for cross-domain auth, otherwise direct backend call
    const uploadUrl = useProxy
      ? `/api/upload/${endpoint}?id=${fileId}`
      : `${API_URL}/upload/${endpoint}?id=${fileId}`;

    const res = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const result = await res.json();
    setUploading(false);

    if (res.ok && result?.url) {
      const fullUrl = `${resolveUrl(result.url)}?t=${Date.now()}`;
      field.onChange(fullUrl);
    } else {
      alert(result?.error || 'Fehler beim Hochladen');
    }
  };

  const handleDelete = async () => {
    try {
      const deleteEndpoint = isImage ? 'delete' : 'delete-pdf';

      // Use proxy route for cross-domain auth, otherwise direct backend call
      const deleteUrl = useProxy
        ? `/api/upload/${deleteEndpoint}?id=${fileId}`
        : `${API_URL}/upload/${deleteEndpoint}?id=${fileId}`;

      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Loeschen fehlgeschlagen');
      }

      field.onChange('');
      // Reset the file input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Fehler beim Loeschen';
      alert(message);
    }
  };

  return (
    <FormField
      name={name}
      control={control}
      render={() => (
        <FormItem className={cn(className, width)}>
          {label && <FormLabel>{t(label)}</FormLabel>}

          <FormControl>
            <Input
              ref={inputRef}
              type="file"
              accept={acceptType}
              onChange={handleFileChange}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}

          {uploading && (
            <p className="text-sm text-muted-foreground mt-1">
              Wird hochgeladen...
            </p>
          )}

          {field.value && isImage && (
            <div className="mt-2 space-y-2 w-[200px]">
              <AspectRatio ratio={aspectRatio}>
                <Image
                  key={field.value}
                  src={field.value}
                  alt="Vorschau"
                  className="h-full w-full rounded-lg object-cover border shadow"
                  fill
                  unoptimized
                />
              </AspectRatio>

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

          {field.value && isPdf && (
            <div className="mt-2 flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
              <FileText className="h-8 w-8 text-red-500" />
              <div className="flex-1">
                <a
                  href={resolveUrl(field.value)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  PDF anzeigen
                </a>
              </div>
              {allowDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
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
