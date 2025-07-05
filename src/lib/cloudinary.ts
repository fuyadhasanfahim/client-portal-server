import { v2 as cloudinary } from "cloudinary";
import envConfig from "../config/env.config";

const { cloud_name, api_key, api_secret } = envConfig;

cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
});

export default cloudinary;
