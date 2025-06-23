import { Router } from "express";
import InvoiceControllers from "../controllers/invoice.controller";

const router = Router();

router.post("/send-invoice-pdf-to-client", InvoiceControllers.sendInvoiceToClientByEmail);

export const invoiceRoute = router;
