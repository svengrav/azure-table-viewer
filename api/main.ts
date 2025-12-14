import { Application, Router } from "@oak/oak";
import { oakCors } from "@tajpouria/cors";
import routeStaticFilesFrom from "./static/static.ts";
import { listTables, fetchTableEntities, validateConnection } from "./services/azureTableService.ts";
import type { TableEntity } from "../app/types/index.ts";

export const app = new Application();
const router = new Router();

// Azure Table Storage Routes
router.post("/api/azure/validate", async (context) => {
    try {
        const body = await context.request.body.json();
        const { connectionString } = body as { connectionString: string };
        
        if (!connectionString) {
            context.response.status = 400;
            context.response.body = { error: "Connection string required" };
            return;
        }
        
        const isValid = await validateConnection(connectionString);
        context.response.body = { valid: isValid };
    } catch (error) {
        context.response.status = 500;
        context.response.body = { error: error instanceof Error ? error.message : "Validation failed" };
    }
});

router.post("/api/azure/tables", async (context) => {
    try {
        const body = await context.request.body.json();
        const { connectionString } = body as { connectionString: string };
        
        if (!connectionString) {
            context.response.status = 400;
            context.response.body = { error: "Connection string required" };
            return;
        }
        
        const tables = await listTables(connectionString);
        context.response.body = { tables };
    } catch (error) {
        context.response.status = 500;
        context.response.body = { error: error instanceof Error ? error.message : "Failed to list tables" };
    }
});

router.post("/api/azure/table/:name", async (context) => {
    try {
        const body = await context.request.body.json();
        const { connectionString, filter } = body as { connectionString: string; filter?: string };
        const tableName = context.params.name as string;
        
        if (!connectionString) {
            context.response.status = 400;
            context.response.body = { error: "Connection string required" };
            return;
        }
        
        if (!tableName) {
            context.response.status = 400;
            context.response.body = { error: "Table name required" };
            return;
        }
        
        // Debug: Log filter if provided
        if (filter && filter.trim()) {
            console.log(`Applying filter: ${filter}`);
        }
        
        const entities = await fetchTableEntities(connectionString, tableName, filter) as TableEntity[];
        context.response.body = { entities };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Failed to fetch entities";
        console.error("Filter error:", errorMsg);
        context.response.status = 500;
        context.response.body = { error: errorMsg };
    }
});

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());
app.use(routeStaticFilesFrom([
    `${Deno.cwd()}/dist`,
    `${Deno.cwd()}/public`,
]));

if (import.meta.main) {
    console.log("Server listening on port http://localhost:8000");
    await app.listen({ port: 8000 });
}