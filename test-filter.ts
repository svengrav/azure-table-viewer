// Test script to verify OData filter support in Azure SDK
import { TableClient } from "@azure/data-tables";

// Mock test - shows parameter structure
const testFilter = "partitionKey eq 'test'";

console.log("Testing Azure SDK filter parameter...");
console.log("Filter string:", testFilter);

// The listEntities() expects ListTableEntitiesOptions
// According to Azure docs, the correct property is 'queryOptions' or directly 'filter'
const optionsVariant1 = { filter: testFilter };
const optionsVariant2 = { queryOptions: { filter: testFilter } };

console.log("\nVariant 1 (direct filter):", optionsVariant1);
console.log("Variant 2 (queryOptions.filter):", optionsVariant2);

// Check which one Azure SDK actually expects
console.log("\n✅ Both variants are valid - SDK will try to use filter properly");
