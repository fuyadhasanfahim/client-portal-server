import { Router } from "express";
import { orderRoute } from "./order.route.js";
import { userRoute } from "./user.route.js";
import { invoiceRoute } from "./invoice.route.js";
import { serviceRoute } from "./service.route.js";
import { paymentRoute } from "./payment.route.js";
import { adminRoute } from "./admin.route.js";
import { stripeRoute } from "./stripe.route.js";

const router = Router();

const moduleRoutes = [
    {
        path: "/users",
        route: userRoute,
    },
    {
        path: "/admin",
        route: adminRoute,
    },
    {
        path: "/orders",
        route: orderRoute,
    },
    {
        path: "/invoice",
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
    {
        path: "/stripe",
        route: stripeRoute,
    },
];

moduleRoutes.forEach(({ path, route }) => {
    router.use(path, route);
});

export default router;
