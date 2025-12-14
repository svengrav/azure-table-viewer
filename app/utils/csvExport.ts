import type { TableEntity } from "../types/index.ts";

export function entitiesToCSV(entities: TableEntity[]): string {
  if (entities.length === 0) {
    return "";
  }

  // Get all unique column names
  const columns = Array.from(
    new Set(entities.flatMap((entity) => Object.keys(entity)))
  );

  // Create CSV header
  const header = columns.map((col) => `"${col}"`).join(",");

  // Create CSV rows
  const rows = entities.map((entity) =>
    columns
      .map((col) => {
        const value = entity[col];
        
        // Handle different data types
        if (value === null || value === undefined) {
          return '""';
        }
        
        if (typeof value === "string") {
          // Escape quotes and wrap in quotes
          return `"${value.replace(/"/g, '""')}"`;
        }
        
        if (typeof value === "object") {
          // Convert objects to JSON string
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        
        // Numbers and booleans
        return `"${String(value)}"`;
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}

export function downloadCSV(
  csv: string,
  filename: string = "export.csv"
): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}
