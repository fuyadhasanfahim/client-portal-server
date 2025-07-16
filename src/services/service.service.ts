import ServiceModel from "../models/service.model.js";

const getServicesFromDB = async () => {
    try {
        const services = await ServiceModel.find();

        return services;
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please try again later."
        );
    }
};

const ServiceServices = { getServicesFromDB };
export default ServiceServices;
