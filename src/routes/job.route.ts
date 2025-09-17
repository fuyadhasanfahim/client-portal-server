import { Router } from "express";
import { getJobByID, GetJobs } from "../controllers/job.controller.js";

const router = Router();

router.get("/get-jobs", GetJobs);
router.get("/get-job/:id", getJobByID);

export const jobRoute = router;
