import express, { Application, raw, Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import router from "./routes/index.js";
import { verifyAuth } from "./middleware/verifyAuth.js";
import cookieParser from "cookie-parser";
import StripeControllers from "./controllers/stripe.controller.js";
import envConfig from "./config/env.config.js";
import "./jobs/chargeOverduePayments";

const { frontend_url } = envConfig;

const app: Application = express();

const corsOptions = {
    origin: frontend_url!,
    credentials: true,
};
app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

app.post(
    "/api/stripe/payment-webhook",
    raw({ type: "application/json" }),
    StripeControllers.paymentWebhook
);

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api", verifyAuth, router);

app.get("/", (_req: Request, res: Response) => {
    res.send("Server is running successfully!");
});

export default app;
