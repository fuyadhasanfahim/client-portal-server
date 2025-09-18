import { Router } from "express";
import {
    getApplicantByID,
    GetApplicants,
    updateApplicant,
} from "../controllers/applicants.controller.js";

const router = Router();

router.get("/get-applicants", GetApplicants);
router.get("/get-applicant/:id", getApplicantByID);
router.put("/update-applicant", updateApplicant);

export const applicantsRoute = router;
