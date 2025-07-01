import { Request, Response } from "express";
import envConfig from "../config/env.config";
import InvoiceService from "../services/invoice.service";
import { sendEmail } from "../lib/nodemailer";

const { frontend_url } = envConfig;

const sendInvoiceToClientByEmail = async (req: Request, res: Response) => {
    try {
        const { orderID } = req.body;

        if (!orderID) {
            res.status(400).json({
                success: false,
                message: "Order ID is required",
            });
        }

        const user = await InvoiceService.sendInvoiceToClientByEmail(orderID);

        if (!user)
            res.status(404).json({ success: false, message: "User not found" });

        const email = user.email;
        const invoiceLink = `${frontend_url}/orders/invoice/${orderID}`;

        await sendEmail({
            to: email,
            subject: "Your Invoice is Ready",
            html: `<!DOCTYPE html>
                        <html lang="en">
                        <head>
                        <meta charset="UTF-8" />
                        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                        <style>
                            body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            background-color: #f6f9fc;
                            margin: 0;
                            padding: 0;
                            color: #333;
                            }

                            .email-wrapper {
                            max-width: 600px;
                            margin: 40px auto;
                            background: #ffffff;
                            border-radius: 10px;
                            overflow: hidden;
                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                            padding: 30px;
                            }

                            .email-header {
                            text-align: center;
                            border-bottom: 1px solid #e5e7eb;
                            padding-bottom: 20px;
                            }

                            .email-header h2 {
                            margin: 0;
                            font-size: 24px;
                            color: #111827;
                            }

                            .email-body {
                            padding: 30px 0;
                            line-height: 1.6;
                            }

                            .email-body p {
                            margin: 10px 0;
                            }

                            .cta-button {
                            display: inline-block;
                            padding: 12px 25px;
                            margin: 20px 0;
                            background-color: #6366f1;
                            color: white;
                            text-decoration: none;
                            font-weight: 600;
                            border-radius: 6px;
                            transition: background-color 0.2s ease-in-out;
                            }

                            .cta-button:hover {
                            background-color: #4f46e5;
                            }

                            .email-footer {
                            font-size: 12px;
                            color: #6b7280;
                            border-top: 1px solid #e5e7eb;
                            padding-top: 20px;
                            text-align: center;
                            }

                            .email-footer p {
                            margin: 8px 0;
                            }

                            a {
                            color: #4f46e5;
                            word-break: break-all;
                            }
                        </style>
                        </head>
                        <body>
                        <div class="email-wrapper">
                            <div class="email-header">
                            <h2>Your Invoice is Ready</h2>
                            </div>
                            <div class="email-body">
                            <p>Hi,</p>
                            <p>Thank you for your order. Your invoice is now available. Please click the button below to view or download your invoice:</p>
                            <div style="text-align: center;">
                                <a href="${invoiceLink}" class="cta-button">View Invoice</a>
                            </div>
                            <p>If you did not place this order, please contact us immediately.</p>
                            </div>
                            <div class="email-footer">
                            <p>If you’re having trouble clicking the button, copy and paste the URL below into your web browser:</p>
                            <p><a href="${invoiceLink}">${invoiceLink}</a></p>
                            <p>&copy; 2025 Your Company. All rights reserved.</p>
                            </div>
                        </div>
                        </body>
                        </html>`,
        });

        res.json({ success: true, message: "Invoice emailed successfully." });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Failed to send invoice email.",
            error: (error as Error).message,
        });
    }
};

const newInvoice = async (req: Request, res: Response) => {
    try {
        const {
            invoiceID,
            client,
            company,
            orders,
            date,
            taxRate,
            subTotal,
            total,
            createdBy,
        } = req.body;

        const invoice = await InvoiceService.saveInvoiceIntoDB({
            invoiceID,
            client,
            company,
            orders,
            date,
            taxRate,
            subTotal,
            total,
            createdBy,
        });

        res.status(201).json({
            success: true,
            message: "Invoice created successfully",
            data: invoice,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to send invoice email.",
            error: (error as Error).message,
        });
    }
};

const getInvoiceByID = async (req: Request, res: Response) => {
    try {
        const { invoiceID } = req.query;

        if (!invoiceID || typeof invoiceID !== "string") {
            res.status(400).json({
                success: false,
                message: "Invoice id is required",
            });
            return;
        }

        const data = await InvoiceService.getInvoiceByIdFromDB(invoiceID);

        if (!data) {
            res.status(404).json({
                success: false,
                message: "Invoice not found",
            });
        }

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request",
            error:
                error instanceof Error
                    ? error.message
                    : "Something went wrong! Please try again later.",
        });
    }
};

const InvoiceControllers = {
    sendInvoiceToClientByEmail,
    newInvoice,
    getInvoiceByID,
};

export default InvoiceControllers;
