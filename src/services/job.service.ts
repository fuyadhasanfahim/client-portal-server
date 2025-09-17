/* eslint-disable @typescript-eslint/no-explicit-any */
import JobModel from "../models/job.model.js";

interface GetJobsFromDBProps {
    search?: string;
    page: number;
    limit: number;
    sort: string;
    sortOrder?: string;
    filter?: string;
}

export async function GetJobsFromDB({
    search = "",
    page = 1,
    limit = 10,
    sort = "createdAt",
    sortOrder = "asc",
    filter = "all",
}: GetJobsFromDBProps) {
    const query: any = {
        isActive: true,
    };

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: "i" } },
            { department: { $regex: search, $options: "i" } },
            { salary: { $regex: search, $options: "i" } },
            { employmentStatus: { $regex: search, $options: "i" } },
            { workplace: { $regex: search, $options: "i" } },
        ];
    }

    if (filter && filter !== "all") {
        query.status = filter;
    }

    const sortBy: any = {
        [sort]: sortOrder === "asc" ? 1 : -1,
    };

    const skip = (page - 1) * limit;

    const [jobs, totalJobs] = await Promise.all([
        await JobModel.find(query).sort(sortBy).skip(skip).limit(limit).lean(),
        JobModel.countDocuments(query),
    ]);

    return {
        jobs,
        pagination: {
            total: totalJobs,
            page,
            limit,
            totalPages: Math.ceil(totalJobs / limit),
        },
    };
}

export async function getJobByIDFromDB(id: string) {
    const data = await JobModel.findById(id).lean();

    return data;
}
