import ServiceModel from "../models/service.model";

const getAllServices = async () => {
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

const ServiceServices = { getAllServices };
export default ServiceServices;
