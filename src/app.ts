import express, { Application } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import router from "./routes";
import { verifyAuth } from "./middleware/verifyAuth";

const app: Application = express();

const corsOptions = {
    origin: "http://localhost:3000",
    credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api", verifyAuth, router);

export default app;
