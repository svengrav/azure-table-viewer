import { TableClient, TableServiceClient } from "@azure/data-tables";
import type { TableEntity } from "../types";

export async function fetchTableEntities(
  connectionString: string,
  tableName: string
): Promise<TableEntity[]> {
  const client = TableClient.fromConnectionString(connectionString, tableName);
  
  const entities: TableEntity[] = [];
  const iterator = client.listEntities();
  
  for await (const entity of iterator) {
    const { partitionKey, rowKey, timestamp, ...rest } = entity as Record<string, unknown>;
    entities.push({
      partitionKey: partitionKey as string,
      rowKey: rowKey as string,
      timestamp: timestamp instanceof Date ? timestamp.toISOString() : undefined,
      ...rest,
    });
  }
  
  return entities;
}

export async function listTables(connectionString: string): Promise<string[]> {
  const serviceClient = TableServiceClient.fromConnectionString(connectionString);
  const tables: string[] = [];
  for await (const table of serviceClient.listTables()) {
    if (table.name) {
      tables.push(table.name);
    }
  }
  return tables;
}
