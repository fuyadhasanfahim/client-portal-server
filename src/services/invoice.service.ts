import OrderModel from "../models/order.model";
import UserModel from "../models/user.model";

const sendInvoiceToClientByEmail = async (orderID: string) => {
    try {
        const order = await OrderModel.findOne({ orderID });

        const user = await UserModel.findOne({ userID: order.userID });

        return user;
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please, try again later."
        );
    }
};

const InvoiceService = { sendInvoiceToClientByEmail };

export default InvoiceService;
