import { Router } from "express";
import { orderRoute } from "./order.route";
import { userRoute } from "./user.route";
import { invoiceRoute } from "./invoice.route";
import { serviceRoute } from "./service.route";

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
];

moduleRoutes.forEach(({ path, route }) => {
    router.use(path, route);
});

export default router;
