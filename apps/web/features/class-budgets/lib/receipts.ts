import { API_URL } from "@/constants/api-url";

export const RECEIPT_MAX_BYTES = 15 * 1024 * 1024;

export const RECEIPT_ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";

const RECEIPT_MIME_TYPES = RECEIPT_ACCEPT.split(",");

export type ReceiptRejection = "type" | "size";

/** Client-side pre-check; the backend enforces the same rules again. */
export const rejectReceipt = (file: {
  type: string;
  size: number;
}): ReceiptRejection | null => {
  if (!RECEIPT_MIME_TYPES.includes(file.type)) return "type";
  if (file.size > RECEIPT_MAX_BYTES) return "size";
  return null;
};

/**
 * Receipts are addressed by class + file id; the class id is mandatory so the
 * backend can check access to the class before touching storage.
 */
export const receiptUrl = (schoolClassId: string, fileId: string): string =>
  `${API_URL}/expense-receipts/${encodeURIComponent(fileId)}?schoolClassId=${encodeURIComponent(schoolClassId)}`;

export const uploadReceipt = async (
  schoolClassId: string,
  file: File,
): Promise<string> => {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(
    `${API_URL}/expense-receipts?schoolClassId=${encodeURIComponent(schoolClassId)}`,
    { method: "POST", body, credentials: "include" },
  );
  if (!response.ok) throw new Error(`Upload failed (${response.status})`);
  const { fileId } = (await response.json()) as { fileId: string };
  return fileId;
};

/** Removes an uploaded receipt that was never attached to an expense. */
export const discardReceipt = async (
  schoolClassId: string,
  fileId: string,
): Promise<void> => {
  await fetch(receiptUrl(schoolClassId, fileId), {
    method: "DELETE",
    credentials: "include",
  });
};
