import { Router } from "express";
import ServiceControllers from "../controllers/service.controller.js";

const router = Router();

router.get("/get-services", ServiceControllers.getServices);

export const serviceRoute = router;
