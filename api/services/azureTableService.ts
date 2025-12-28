import { ListTableEntitiesOptions, TableClient, TableServiceClient } from "@azure/data-tables";
import type { TableEntity } from "../../app/types/index.ts";

export interface PaginatedEntitiesResponse {
  entities: TableEntity[];
  continuationToken?: string;
  hasMore: boolean;
}

export async function fetchTableEntities(
  connectionString: string,
  tableName: string,
  filter?: string,
  pageSize?: number,
  continuationToken?: string
): Promise<PaginatedEntitiesResponse> {
  const client = TableClient.fromConnectionString(connectionString, tableName);
  
  const entities: TableEntity[] = [];
  
  // Azure SDK v13 uses queryOptions with filter property
  // See: https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/tables/data-tables/src/TableClient.ts
  const listOptions: ListTableEntitiesOptions = {};
  if (filter && filter.trim()) {
    listOptions.queryOptions = {
      filter: filter.trim(),
    };
  }
    
  try {
    // Use byPage() for pagination support
    const maxPageSize = pageSize || 100;
    const pages = client.listEntities(listOptions).byPage({
      maxPageSize,
      continuationToken,
    });
    
    // Get only the first page
    const firstPage = await pages.next();
    
    if (!firstPage.done && firstPage.value) {
      for (const entity of firstPage.value) {
        const { partitionKey, rowKey, etag, ...rest } = entity as Record<string, unknown>;
        
        // Azure SDK gibt timestamp als Date Objekt zurück
        const entityTimestamp = (entity as any).timestamp || new Date();
        const timestampStr = entityTimestamp instanceof Date ? entityTimestamp.toISOString() : String(entityTimestamp);
        
        entities.push({
          partitionKey: partitionKey as string,
          rowKey: rowKey as string,
          timestamp: timestampStr,
          ...rest,
        });
      }
    }
    
    // Extract continuation token for next page
    const nextToken = firstPage.value?.continuationToken;
    
    return {
      entities,
      continuationToken: nextToken,
      hasMore: !!nextToken,
    };
    
  } catch (error) {
    console.error(`❌ Error fetching entities:`, error instanceof Error ? error.message : error);
    return {
      entities: [],
      hasMore: false,
    };
  }
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

export async function validateConnection(connectionString: string): Promise<boolean> {
  try {
    const serviceClient = TableServiceClient.fromConnectionString(connectionString);
    // Versuche die erste Tabelle zu laden - zeigt ob Credentials gültig sind
    for await (const _table of serviceClient.listTables()) {
      return true;
    }
    return true;
  } catch {
    return false;
  }
}
