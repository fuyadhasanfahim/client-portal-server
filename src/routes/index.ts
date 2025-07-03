import { Router } from "express";
import { orderRoute } from "./order.route";
import { userRoute } from "./user.route";
import { invoiceRoute } from "./invoice.route";
import { serviceRoute } from "./service.route";
import { paymentRoute } from "./payment.route";

const router = Router();

const moduleRoutes = [
    {
        path: "/orders",
        route: orderRoute,
    },
    {
        path: "/users",
        route: userRoute,
    },
    {
        path: "/invoices",
        route: invoiceRoute,
    },
    {
        path: "/services",
        route: serviceRoute,
    },
    {
        path: "/payments",
        route: paymentRoute,
    },
];

moduleRoutes.forEach(({ path, route }) => {
    router.use(path, route);
});

export default router;
