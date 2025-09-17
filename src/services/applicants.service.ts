/* eslint-disable @typescript-eslint/no-explicit-any */
import ApplicantModel from "../models/applicant.model.js";

interface getApplicantsProps {
    search?: string;
    page: number;
    limit: number;
    sort: string;
    sortOrder?: string;
    filter?: string;
}

export async function getApplicantsFromDB({
    page = 1,
    limit = 10,
    sort = "createdAt",
    sortOrder = "asc",
    search = "",
    filter,
}: getApplicantsProps) {
    const query: any = {};

    if (search) {
        query.$or = [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { status: { $regex: search, $options: "i" } },
        ];
    }

    if (filter && filter !== "all") {
        query.status = filter;
    }

    const sortBy: any = {
        [sort]: sortOrder === "asc" ? 1 : -1,
    };

    const skip = (page - 1) * limit;

    const [applicants, totalApplicants] = await Promise.all([
        await ApplicantModel.find(query)
            .sort(sortBy)
            .skip(skip)
            .limit(limit)
            .lean(),
        ApplicantModel.countDocuments(query),
    ]);

    return {
        applicants,
        pagination: {
            total: totalApplicants,
            page,
            limit,
            totalPages: Math.ceil(totalApplicants / limit),
        },
    };
}

export async function getApplicantByIDFromDB(id: string) {
    const data = await ApplicantModel.findById(id).lean();

    return data;
}
