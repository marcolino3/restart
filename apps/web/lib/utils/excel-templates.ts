import * as XLSX from "xlsx";

/**
 * Convert an Excel file (xlsx) to CSV format (semicolon-delimited).
 * Uses the first sheet of the workbook.
 */
export async function xlsxToCsv(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const csvData = XLSX.utils.sheet_to_csv(worksheet, { FS: ";" });

        const csvBlob = new Blob([csvData], { type: "text/csv" });
        const csvFile = new File(
          [csvBlob],
          file.name.replace(/\.xlsx?$/i, ".csv"),
          { type: "text/csv" },
        );

        resolve(csvFile);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Check if file is an Excel file
 */
export function isExcelFile(file: File): boolean {
  return /\.xlsx?$/i.test(file.name);
}
