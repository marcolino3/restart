import { toast } from "sonner";

type HandleActionOptions<T> = {
  action: () => Promise<{ success: true; data: T } | { success: false; error?: unknown }>;
  onSuccess?: (data: T) => void | Promise<void>;
  successMessage?: string;
  errorMessage?: string;
};

export async function handleAction<T>({
  action,
  onSuccess,
  successMessage = "Erfolgreich gespeichert",
  errorMessage = "Ein Fehler ist aufgetreten",
}: HandleActionOptions<T>) {
  try {
    const result = await action();

    if (!result.success) {
      toast.error(errorMessage, {
        description: result.error ? String(result.error) : undefined,
      });
      return result;
    }

    toast.success(successMessage);
    await onSuccess?.(result.data);
    return result;
  } catch (error) {
    toast.error(errorMessage, {
      description: error instanceof Error ? error.message : String(error),
    });
    return { success: false as const, error };
  }
}
