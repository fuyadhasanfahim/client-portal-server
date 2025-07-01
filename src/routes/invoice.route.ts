import { Router } from "express";
import InvoiceControllers from "../controllers/invoice.controller";

const router = Router();

router.post(
    "/send-invoice-pdf-to-client",
    InvoiceControllers.sendInvoiceToClientByEmail
);

router.post("/new-invoice", InvoiceControllers.newInvoice);

router.get("/get-invoice-by-id", InvoiceControllers.getInvoiceByID);

export const invoiceRoute = router;
