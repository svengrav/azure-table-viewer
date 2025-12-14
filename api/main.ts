import { Application, Router } from "@oak/oak";
import { oakCors } from "@tajpouria/cors";
import routeStaticFilesFrom from "./static/static.ts";
import data from "./data.json" with { type: "json" };

export const app = new Application();
const router = new Router();



router.get("/api/dinosaurs", (context) => {
    context.response.body = data;
});

router.get("/api/dinosaurs/:dinosaur", (context) => {
    if (!context?.params?.dinosaur) {
        context.response.body = "No dinosaur name provided.";
    }

    const dinosaur = data.find((item) =>
        item.name.toLowerCase() === context.params.dinosaur.toLowerCase()
    );

    context.response.body = dinosaur ?? "No dinosaur found.";
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