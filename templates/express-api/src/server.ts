import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ ok: true, service: "__PROJECT_NAME__" });
});

app.listen(port, () => {
  console.log(`__PROJECT_NAME__ listening on http://localhost:${port}`);
});
