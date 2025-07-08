import { Request, Response } from "express";
import ServiceServices from "../services/service.service";

const getServices = async (_req: Request, res: Response) => {
    try {
        const data = await ServiceServices.getServicesFromDB();

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
};

const ServiceControllers = {
    getServices,
};
export default ServiceControllers;
