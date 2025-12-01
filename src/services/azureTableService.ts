import { TableClient } from "@azure/data-tables";

export interface TableEntity {
  partitionKey: string;
  rowKey: string;
  timestamp?: string;
  [key: string]: unknown;
}

export async function fetchTableEntities(
  connectionString: string,
  tableName: string
): Promise<TableEntity[]> {
  console.log("Fetching entities from table:", tableName);
  const client = TableClient.fromConnectionString(connectionString, tableName);
  
  const entities: TableEntity[] = [];
  const iterator = client.listEntities();
  
  for await (const entity of iterator) {
    const mapped = mapEntity(entity);
    entities.push(mapped);
  }
  
  return entities;
}

function mapEntity(entity: Record<string, unknown>): TableEntity {
  const { partitionKey, rowKey, timestamp, ...rest } = entity;
  
  return {
    partitionKey: partitionKey as string,
    rowKey: rowKey as string,
    timestamp: timestamp instanceof Date ? timestamp.toISOString() : undefined,
    ...rest,
  };
}

export async function listTables(connectionString: string): Promise<string[]> {
  // TableServiceClient für Tabellenliste
  const { TableServiceClient } = await import("@azure/data-tables");
  const serviceClient = TableServiceClient.fromConnectionString(connectionString);
  
  const tables: string[] = [];
  for await (const table of serviceClient.listTables()) {
    if (table.name) {
      tables.push(table.name);
    }
  }
  
  return tables;
}
