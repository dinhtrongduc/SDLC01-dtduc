import express from "express";
import cors from "cors";
import { documentsRouter } from "./routes/documents";
import { chatRouter } from "./routes/chat";
import { store } from "./db/store";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/workspace", (_req, res) => {
  res.json({ workspace: store.getOrCreateDefaultWorkspace() });
});

app.use("/api/documents", documentsRouter);
app.use("/api", chatRouter);

app.listen(PORT, () => {
  store.getOrCreateDefaultWorkspace();
  console.log(`DocuChat AI server đang chạy tại http://localhost:${PORT}`);
});
