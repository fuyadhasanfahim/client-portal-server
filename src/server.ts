import { connect } from "mongoose";
import envConfig from "./config/env.config";
import app from "./app";

const { database_url, port } = envConfig;

async function Server() {
    try {
        await connect(database_url as string);

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error("Error connecting to database:", error);
        process.exit(1);
    }
}

Server();
