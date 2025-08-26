import { Request, Response } from "express";
import ServiceServices from "../services/service.service.js";
import { AddServiceSchema } from "../validators/service.validator.js";

async function getServices(req: Request, res: Response) {
    try {
        const {
            search = "",
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortOrder = "desc",
            filter,
        } = req.query;

        const data = await ServiceServices.getServicesFromDB({
            search: search as string,
            page: Number(page),
            limit: Number(limit),
            sortBy: sortBy as
                | "createdAt"
                | "updatedAt"
                | "name"
                | "price"
                | undefined,
            filter: filter as string,
            sortOrder: sortOrder as "asc" | "desc",
        });

        if (!data) {
            res.status(404).json({
                success: false,
                message: "No services found!",
            });
            return;
        }

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request",
            error:
                error instanceof Error
                    ? error.message
                    : "Something went wrong! Please try again later.",
        });
    }
}

async function newService(req: Request, res: Response) {
    try {
        const body = await req.body;
        console.log("Headers:", req.headers);
        console.log("Raw body:", req.body);
        console.log("Content-Type:", req.get("Content-Type"));

        if (!body || typeof body !== "object") {
            res.status(400).json({ success: false, message: "No data found!" });
            return;
        }

        const parsed = AddServiceSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(422).json({
                success: false,
                message: "Validation failed",
                issues: parsed.error.issues,
            });
            return;
        }

        const service = await ServiceServices.newServiceInDB(parsed.data);

        if (!service) {
            res.status(404).json({
                success: false,
                message: "Something went wrong creating service.",
            });
            return;
        }

        res.status(201).json({
            success: true,
            message: "Service created successfully.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request",
            error:
                error instanceof Error
                    ? error.message
                    : "Something went wrong! Please try again later.",
        });
    }
}

const ServiceControllers = {
    getServices,
    newService,
};
export default ServiceControllers;
