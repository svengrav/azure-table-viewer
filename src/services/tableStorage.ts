import { TableClient, TableServiceClient } from "@azure/data-tables";
import type { TableEntity } from "../types";

export async function fetchTableEntities(
  connectionString: string,
  tableName: string,
  filter?: string
): Promise<TableEntity[]> {
  const client = TableClient.fromConnectionString(connectionString, tableName);
  
  const entities: TableEntity[] = [];
  const queryOptions = filter ? { filter } : undefined;
  const iterator = client.listEntities({ queryOptions });
  
  for await (const entity of iterator) {
    const { partitionKey, rowKey, timestamp, etag, ...rest } = entity as Record<string, unknown>;
    
    // Timestamp kann Date, String oder undefined sein
    let timestampValue: string | undefined;
    if (timestamp instanceof Date) {
      timestampValue = timestamp.toISOString();
    } else if (typeof timestamp === "string") {
      timestampValue = timestamp;
    }
    
    entities.push({
      partitionKey: partitionKey as string,
      rowKey: rowKey as string,
      timestamp: timestampValue,
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

export async function deleteEntity(
  connectionString: string,
  tableName: string,
  partitionKey: string,
  rowKey: string
): Promise<void> {
  const client = TableClient.fromConnectionString(connectionString, tableName);
  await client.deleteEntity(partitionKey, rowKey);
}

export async function updateEntity(
  connectionString: string,
  tableName: string,
  entity: TableEntity
): Promise<void> {
  const client = TableClient.fromConnectionString(connectionString, tableName);
  // Entferne timestamp und etag, da diese vom Server verwaltet werden
  const { timestamp, etag, ...entityData } = entity as TableEntity & { etag?: string };
  // Replace verwendet PUT statt MERGE - besser für CORS
  await client.upsertEntity(entityData as any, "Replace");
}
