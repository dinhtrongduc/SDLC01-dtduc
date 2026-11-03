import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuid } from "uuid";

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB — PRD Story 1.1

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safeOriginal = file.originalname.replace(/[^\w.\-À-ỹ]+/g, "_");
    cb(null, `${uuid()}__${safeOriginal}`);
  },
});

function fileFilter(_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    cb(new Error("UNSUPPORTED_FILE_TYPE"));
    return;
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});
