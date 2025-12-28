import { Next } from "@oak/oak/middleware";
import { Context } from "@oak/oak/context";

// Configure static site routes so that we can serve
// the Vite build output and the public folder
// With SPA fallback: any non-file route returns index.html
export default function routeStaticFilesFrom(staticPaths: string[]) {
    return async (context: Context<Record<string, object>>, next: Next) => {
        // Skip if this is an API route
        if (context.request.url.pathname.startsWith("/api/")) {
            await next();
            return;
        }

        // Try to serve requested file from static paths
        for (const path of staticPaths) {
            try {
                await context.send({ root: path, index: "index.html" });
                return; // File found and served
            } catch {
                // File not found in this path, try next
                continue;
            }
        }

        // SPA Fallback: No static file found, serve index.html
        // This allows React Router to handle the route client-side
        try {
            await context.send({ root: staticPaths[0], path: "index.html" });
        } catch {
            // Even index.html not found, pass to next middleware
            await next();
        }
    };
}