import { Router } from "express";
import { orderRoute } from "./order.route";
import { userRoute } from "./user.route";
import { invoiceRoute } from "./invoice.route";

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
];

moduleRoutes.forEach(({ path, route }) => {
    router.use(path, route);
});

export default router;
