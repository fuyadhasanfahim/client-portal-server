/* eslint-disable @typescript-eslint/no-explicit-any */
import ApplicantModel from "../models/applicant.model.js";
import IApplicant from "../types/applicant.interface.js";

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

    const result = await ApplicantModel.aggregate([
        { $match: query },
        {
            $facet: {
                data: [
                    { $sort: sortBy },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: "jobs",
                            localField: "jobId",
                            foreignField: "_id",
                            as: "job",
                        },
                    },
                    { $unwind: "$job" },
                    {
                        $project: {
                            firstName: 1,
                            lastName: 1,
                            email: 1,
                            phone: 1,
                            status: 1,
                            createdAt: 1,
                            jobTitle: "$job.title",
                            documentUrl: 1,
                        },
                    },
                ],
                totalCount: [{ $count: "count" }],
            },
        },
    ]);

    const applicants = result[0]?.data || [];
    const totalApplicants = result[0]?.totalCount[0]?.count || 0;

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

export async function updateApplicantToDB({
    id,
    data,
}: {
    id: string;
    data: Partial<IApplicant>;
}) {
    const updatedData = await ApplicantModel.findByIdAndUpdate(id, data, {
        new: true,
    });

    return updatedData;
}
