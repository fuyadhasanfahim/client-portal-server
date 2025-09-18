import { Request, Response } from "express";
import {
    getApplicantByIDFromDB,
    getApplicantsFromDB,
    updateApplicantToDB,
} from "../services/applicants.service.js";
import { sendEmail } from "../lib/nodemailer.js";
import envConfig from "../config/env.config.js";
import { buildApplicantStatusEmail } from "../lib/emailTemplate.js";

export async function GetApplicants(req: Request, res: Response) {
    try {
        const {
            search = "",
            page = 1,
            limit = 10,
            filter,
            sort,
            sortOrder,
        } = req.query;

        const { applicants, pagination } = await getApplicantsFromDB({
            search: search as string,
            page: Number(page),
            limit: Number(limit),
            filter: filter as string,
            sort: sort as string,
            sortOrder: sortOrder as string,
        });

        if (!applicants) {
            res.status(404).json({
                success: false,
                message: "No data found.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            applicants,
            pagination,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Something went wrong!",
        });
    }
}

export async function getApplicantByID(req: Request, res: Response) {
    try {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({
                success: false,
                message: "The id is not found, but required.",
            });
            return;
        }

        const applicant = await getApplicantByIDFromDB(id);

        if (!applicant) {
            res.status(404).json({
                success: false,
                message: "No job details found with this information.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            applicant,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Something went wrong!",
        });
    }
}

export async function updateApplicant(req: Request, res: Response) {
    try {
        const { id, data } = req.body;

        if (!id || !data) {
            res.status(400).json({
                success: false,
                message: "Something is missing. Please try again later.",
            });
            return;
        }

        const response = await updateApplicantToDB({
            id,
            data,
        });

        if (!response) {
            res.status(404).json({
                success: false,
                message: "Something went wrong. Please try again later.",
            });
            return;
        }

        const { subject, html } = buildApplicantStatusEmail({
            status: response.status,
            userName: response.firstName || "Applicant",
            userEmail: response.email,
            viewUrl: `https://webbriks.com/job/applicants/${id}`,
        });

        await sendEmail({
            to: response.email,
            from: envConfig.email_user,
            subject,
            html,
        });

        res.status(200).json({
            success: true,
            message: `Status updated to ${response.status} successfully.`,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Something went wrong!",
        });
    }
}
