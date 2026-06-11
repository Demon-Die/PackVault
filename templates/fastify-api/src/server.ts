import Fastify from "fastify";

const app = Fastify({ logger: true });
const port = Number(process.env.PORT ?? 3000);

app.get("/health", async () => {
  return { ok: true, service: "__PROJECT_NAME__" };
});

await app.listen({ port, host: "0.0.0.0" });
