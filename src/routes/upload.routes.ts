import { Router } from "express";
import { getPresignedUpload } from "../controllers/upload.controller.js";

const router = Router();
router.post("/presign", getPresignedUpload);

export const UploadRoutes = router;
