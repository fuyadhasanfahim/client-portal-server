import { Router } from "express";
import ServiceControllers from "../controllers/service.controller";

const router = Router();

router.get("/get-all-services", ServiceControllers.getAllServices);

export const serviceRoute = router;
