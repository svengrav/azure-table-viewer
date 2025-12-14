import type { TableEntity } from "../types/index.ts";

// API endpoint - same path for both dev and production
const API_BASE = "/aztv/api";

interface ApiError {
  error: string;
}

export async function validateConnectionApi(connectionString: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/azure/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionString }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as { valid: boolean };
    return data.valid;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to validate connection"
    );
  }
}

export async function listTablesApi(connectionString: string): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/azure/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionString }),
    });

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = (await response.json()) as { tables: string[] };
    return data.tables;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch tables"
    );
  }
}

export async function fetchTableEntitiesApi(
  connectionString: string,
  tableName: string,
  filter?: string
): Promise<TableEntity[]> {
  try {
    const response = await fetch(`${API_BASE}/azure/table/${tableName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionString, filter }),
    });

    if (!response.ok) {
      const error = (await response.json()) as ApiError;
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = (await response.json()) as { entities: TableEntity[] };
    return data.entities;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch entities"
    );
  }
}
