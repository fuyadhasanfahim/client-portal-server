import { Router } from "express";
import {
    getApplicantByID,
    GetApplicants,
} from "../controllers/applicants.controller.js";

const router = Router();

router.get("/get-applicants", GetApplicants);
router.get("/get-applicant/:id", getApplicantByID);

export const applicantsRoute = router;
