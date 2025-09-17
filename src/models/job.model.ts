import { model, Schema } from "mongoose";
import IJob from "../types/job.interface.js";

const jobSchema = new Schema<IJob>(
    {
        title: {
            type: String,
            required: true,
        },
        company: {
            type: String,
            required: true,
        },
        location: {
            type: String,
            required: true,
        },
        datePosted: { type: Date, required: true },
        vacancies: {
            type: Number,
            required: true,
        },
        hasLogo: {
            type: Boolean,
            required: true,
        },
        department: {
            type: String,
            required: true,
        },
        notes: String,
        salary: {
            type: String,
            required: true,
        },
        experience: {
            type: String,
            required: true,
        },
        employmentStatus: {
            type: String,
            required: true,
        },
        workplace: {
            type: String,
            required: true,
        },
        responsibilities: {
            type: [String],
            required: true,
        },
        requirements: {
            type: [String],
            required: true,
        },
        compensation: {
            type: [String],
            required: true,
        },
        isActive: {
            type: Boolean,
            default: false,
        },
        apply: {
            email: { type: String, required: true },
            subject: { type: String, required: true },
        },
    },
    {
        timestamps: true,
    }
);

const JobModel = model<IJob>("Job", jobSchema);
export default JobModel;
