/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import axios from "axios";
import envConfig from "../config/env.config.js";

const router = Router();

const { paypal_client_id, paypal_client_secret, pay_pal_api_base_url } =
    envConfig;

async function getAccessToken() {
    console.log(
        "Using PayPal credentials:",
        paypal_client_id,
        paypal_client_secret
    ); // Check these values
    const auth = Buffer.from(
        `${paypal_client_id}:${paypal_client_secret}`
    ).toString("base64");

    try {
        const res = await axios.post(
            `${pay_pal_api_base_url}/v1/oauth2/token`,
            "grant_type=client_credentials",
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
        console.log("Token generated successfully");
        return res.data.access_token;
    } catch (error: any) {
        console.error("Token generation failed:", error.response?.data);
        throw error;
    }
}

router.post("/", async (req, res) => {
    try {
        const accessToken = await getAccessToken();
        
        // Use order data from request if available
        const orderData = req.body?.purchase_units?.[0]?.amount || {
            currency_code: "USD",
            value: "10.00" // Fallback
        };

        const response = await axios.post(
            `${pay_pal_api_base_url}/v2/checkout/orders`,
            {
                intent: "CAPTURE",
                purchase_units: [
                    {
                        amount: orderData
                    },
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        res.json(response.data);
    } catch (error: any) {
        console.error(
            "PayPal Order Creation Failed",
            error.response?.data || error.message
        );
        res.status(500).json({
            error: error.response?.data || "Failed to create PayPal order",
        });
    }
});

// Capture PayPal Order
router.post("/:orderID/capture", async (req, res) => {
    try {
        const { orderID } = req.params;
        const accessToken = await getAccessToken();

        const response = await axios.post(
            `${pay_pal_api_base_url}/v2/checkout/orders/${orderID}/capture`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return res.json(response.data);
    } catch (error: any) {
        console.error(
            "PayPal Capture Failed",
            error.response?.data || error.message
        );

        if (!res.headersSent) {
            return res.status(500).json({
                error:
                    error.response?.data || "Failed to capture PayPal payment",
            });
        }
    }
});

export const paypalRoute = router;
