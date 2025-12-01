export interface TableEntity {
  partitionKey: string;
  rowKey: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface ConnectionConfig {
  connectionString: string;
  tableName: string;
}
