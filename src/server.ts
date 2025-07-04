import { connect } from "mongoose";
import envConfig from "./config/env.config";
import app from "./app";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import registerSocketHandlers from "./socket";

const { database_url, port, frontend_url } = envConfig;

async function Server() {
    try {
        await connect(database_url as string);

        const server = createServer(app);
        const io = new SocketIOServer({
            cors: {
                origin: frontend_url,
                credentials: true,
            },
        });

        registerSocketHandlers(io);

        server.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error("Error connecting to database:", error);
        process.exit(1);
    }
}

Server();
