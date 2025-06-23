import express, { Application } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import router from "./routes";
import { verifyAuth } from "./middleware/verifyAuth";
import envConfig from "./config/env.config";

const { frontend_url } = envConfig;

const app: Application = express();

const corsOptions = {
    origin: frontend_url!,
    credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api", verifyAuth, router);

app.use("/", (_req, res) => {
    res.send("Client Portal Server");
});

export default app;
