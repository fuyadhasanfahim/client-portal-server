/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from "express";
import axios from "axios";
import envConfig from "../config/env.config.js";
import { OrderModel } from "../models/order.model.js";
import {
    IOrder,
    IOrderServiceSelection,
    IOrderServiceType,
} from "../types/order.interface.js";

const router = Router();

const { paypal_client_id, paypal_client_secret, paypal_api_base_url } =
    envConfig;

function calculateOrderTotal(order: IOrder): {
    items: any[];
    total: number;
} {
    const items: any[] = [];
    const imageCount = order.details?.images || 0;
    let total = 0;

    order.services.forEach((service: IOrderServiceSelection) => {
        if (service.price) {
            const amount = service.price * imageCount;
            total += amount;
            items.push({
                name: `${service.name} (flat price)`,
                unit_amount: {
                    currency_code: "USD",
                    value: service.price.toFixed(2),
                },
                quantity: imageCount.toString(),
            });
        }

        if (service.complexity) {
            const amount = service.complexity.price * imageCount;
            total += amount;
            items.push({
                name: `${service.name} → ${service.complexity.name}`,
                unit_amount: {
                    currency_code: "USD",
                    value: service.complexity.price.toFixed(2),
                },
                quantity: imageCount.toString(),
            });
        }

        if (service.types?.length) {
            service.types.forEach((type: IOrderServiceType) => {
                if (type.complexity) {
                    const amount = type.complexity.price * imageCount;
                    total += amount;
                    items.push({
                        name: `${service.name} → ${type.name} → ${type.complexity.name}`,
                        unit_amount: {
                            currency_code: "USD",
                            value: type.complexity.price.toFixed(2),
                        },
                        quantity: imageCount.toString(),
                    });
                }
            });
        }

        if (service.options?.length) {
            const optionFee = 0.25;
            const amount = service.options.length * optionFee * imageCount;
            total += amount;
            items.push({
                name: `${service.name} → ${service.options.length} option(s)`,
                unit_amount: {
                    currency_code: "USD",
                    value: optionFee.toFixed(2),
                },
                quantity: (service.options.length * imageCount).toString(),
            });
        }
    });

    if (order.details?.imageResizing) {
        const resizingFee = 0.25;
        const amount = resizingFee * imageCount;
        total += amount;
        items.push({
            name: `Image resizing`,
            unit_amount: {
                currency_code: "USD",
                value: resizingFee.toFixed(2),
            },
            quantity: imageCount.toString(),
        });
    }

    return { items, total };
}

async function getAccessToken() {
    const auth = Buffer.from(
        `${paypal_client_id}:${paypal_client_secret}`
    ).toString("base64");

    try {
        const res = await axios.post(
            `${paypal_api_base_url}/v1/oauth2/token`,
            "grant_type=client_credentials",
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
        return res.data.access_token;
    } catch (error: any) {
        console.error("PayPal token generation failed:", error.response?.data);
        throw new Error("Failed to generate PayPal access token");
    }
}

router.post("/create-order", async (req, res) => {
    try {
        const { orderID } = req.body;

        if (!orderID) {
            res.status(400).json({ error: "Order ID is required" });
            return;
        }

        const order = await OrderModel.findOne({ orderID });
        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }

        if (order.orderStage !== "details-provided") {
            res.status(400).json({
                error: "Order not ready for payment",
                currentStage: order.orderStage,
            });
            return;
        }

        if (order.paymentStatus === "paid") {
            res.status(400).json({ error: "Order already paid" });
            return;
        }

        const accessToken = await getAccessToken();

        const { items, total } = calculateOrderTotal(order);

        const response = await axios.post(
            `${paypal_api_base_url}/v2/checkout/orders`,
            {
                intent: "CAPTURE",
                purchase_units: [
                    {
                        reference_id: order.orderID.toString(),
                        description: `Order ${order.orderID} payment`,
                        amount: {
                            currency_code: "USD",
                            value: total.toFixed(2),
                            breakdown: {
                                item_total: {
                                    currency_code: "USD",
                                    value: total.toFixed(2),
                                },
                            },
                        },
                        items,
                    },
                ],
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        order.paymentID = response.data.id;
        order.paymentStatus = "pending";
        await order.save();

        res.json({
            paypalOrderID: response.data.id,
            status: response.data.status,
            links: response.data.links,
        });
    } catch (error: any) {
        console.log("Failed to create PayPal order:", error.message);
        res.status(500).json({
            error: "Failed to create PayPal order",
            details: error.response?.data || error.message,
        });
    }
});

router.post("/:orderID/capture", async (req, res) => {
    try {
        const { orderID } = req.params;
        const accessToken = await getAccessToken();

        const response = await axios.post(
            `${paypal_api_base_url}/v2/checkout/orders/${orderID}/capture`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const order = await OrderModel.findOne({ orderID });
        if (!order) {
            res.status(404).json({ error: "Order not found" });
            return;
        }

        if (response.data.status === "COMPLETED") {
            order.paymentStatus = "paid";
            order.orderStage = "payment-completed";
            await order.save();
        }

        res.json({
            status: response.data.status,
            orderStatus: order.status,
            paymentStatus: order.paymentStatus,
            captureDetails:
                response.data.purchase_units[0].payments.captures[0],
        });
    } catch (error: any) {
        console.error(
            "PayPal Capture Failed",
            error.response?.data || error.message
        );
        res.status(500).json({
            error: error.response?.data || "Failed to capture PayPal payment",
        });
    }
});

export const paypalRoute = router;
