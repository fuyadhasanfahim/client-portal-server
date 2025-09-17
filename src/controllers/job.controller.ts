import { Request, Response } from "express";
import { getJobByIDFromDB, GetJobsFromDB } from "../services/job.service.js";

export async function GetJobs(req: Request, res: Response) {
    try {
        const {
            search = "",
            page = 1,
            limit = 10,
            filter,
            sort,
            sortOrder,
        } = req.query;

        const { jobs, pagination } = await GetJobsFromDB({
            search: search as string,
            page: Number(page),
            limit: Number(limit),
            filter: filter as string,
            sort: sort as string,
            sortOrder: sortOrder as string,
        });

        if (!jobs) {
            res.status(404).json({
                success: false,
                message: "No data found.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            jobs,
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

export async function getJobByID(req: Request, res: Response) {
    try {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({
                success: false,
                message: "The id is not found, but required.",
            });
            return;
        }

        const job = await getJobByIDFromDB(id);

        if (!job) {
            res.status(404).json({
                success: false,
                message: "No job details found with this information.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            job,
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
