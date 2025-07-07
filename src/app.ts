import express, { Application, Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import router from "./routes";
import { verifyAuth } from "./middleware/verifyAuth";
import cookieParser from "cookie-parser";
import envConfig from "./config/env.config";

const { frontend_url } = envConfig;

const app: Application = express();

const corsOptions = {
    origin: frontend_url!,
    credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api", verifyAuth, router);

app.get("/", (_req: Request, res: Response) => {
    res.send("Server is running successfully!");
});

export default app;
