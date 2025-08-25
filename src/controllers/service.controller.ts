import { Request, Response } from "express";
import ServiceServices from "../services/service.service.js";
import z from "zod";

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

const complexitySchema = z.object({
    name: z.string().min(1, "Complexity name is required"),
    price: z.coerce.number().min(0, "Price must be ≥ 0"),
});
const typeSchema = z.object({
    name: z.string().min(1, "Type name is required"),
    price: z.coerce
        .number()
        .min(0)
        .optional()
        .or(z.nan().transform(() => undefined)),
    complexities: z.array(complexitySchema).optional(),
});
const serviceSchema = z.object({
    name: z.string().min(1, "Service name is required"),
    price: z.coerce
        .number()
        .min(0)
        .optional()
        .or(z.nan().transform(() => undefined)),
    complexities: z.array(complexitySchema).optional(),
    types: z.array(typeSchema).optional(),
    options: z.boolean().default(false),
    inputs: z.boolean().default(false),
    instruction: z.string().optional(),
    disabledOptions: z.array(z.string().min(1)).optional(),
});

async function newService(req: Request, res: Response) {
    try {
        const body = req.body;

        if (!body || typeof body !== "object") {
            return res
                .status(400)
                .json({ success: false, message: "No data found!" });
        }

        const parsed = serviceSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(422).json({
                success: false,
                message: "Validation failed",
                issues: parsed.error.issues,
            });
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
