export interface TableEntity {
  partitionKey: string;
  rowKey: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  entities: T[];
  continuationToken?: string;
  hasMore: boolean;
}

export type AppState =
  | { status: "disconnected" }
  | { status: "loading-tables" }
  | { status: "tables-loaded"; connectionString: string; tables: string[] }
  | { status: "loading-data"; connectionString: string; tables: string[]; selectedTable: string }
  | { status: "connected"; connectionString: string; tables: string[]; tableName: string; entities: TableEntity[]; continuationToken?: string; hasMore: boolean }
  | { status: "error"; message: string; connectionString?: string };
