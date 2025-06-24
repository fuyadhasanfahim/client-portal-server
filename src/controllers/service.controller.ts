import { Request, Response } from "express";
import ServiceServices from "../services/service.service";

const getAllServices = async (_req: Request, res: Response) => {
    try {
        const data = await ServiceServices.getAllServices();

        if (!data) {
            res.status(404).json({
                success: false,
                message: "No services found!",
            });
        }

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong! Please try again later.",
            error: error instanceof Error ? error.message : error,
        });
    }
};

const ServiceControllers = {
    getAllServices,
};
export default ServiceControllers;
