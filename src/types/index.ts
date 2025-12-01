export interface TableEntity {
  partitionKey: string;
  rowKey: string;
  timestamp?: string;
  [key: string]: unknown;
}

export type AppState =
  | { status: "disconnected" }
  | { status: "loading-tables" }
  | { status: "tables-loaded"; connectionString: string; tables: string[] }
  | { status: "loading-data"; connectionString: string; tables: string[]; selectedTable: string }
  | { status: "connected"; connectionString: string; tables: string[]; tableName: string; entities: TableEntity[] }
  | { status: "error"; message: string; connectionString?: string };
