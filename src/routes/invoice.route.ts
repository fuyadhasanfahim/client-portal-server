import { Router } from "express";
import InvoiceControllers from "../controllers/invoice.controller";

const router = Router();

router.post("/send-invoice", InvoiceControllers.sendInvoice);

export const invoiceRoute = router;
