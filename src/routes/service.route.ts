import { Router } from "express";
import ServiceControllers from "../controllers/service.controller";

const router = Router();

router.get("/get-services", ServiceControllers.getServices);

export const serviceRoute = router;
