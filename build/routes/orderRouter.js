"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const middlewear_1 = require("../utils/middlewear");
const Product_1 = __importDefault(require("../models/Product"));
const mongoose_1 = __importDefault(require("mongoose"));
const Order_1 = __importDefault(require("../models/Order"));
const paypalController_1 = __importDefault(require("../utils/paypalController"));
const helpers_1 = require("../utils/helpers");
const TempOrder_1 = __importDefault(require("../models/TempOrder"));
// import paypalClient from '../utils/paypalClient'
// Baseurl is /api/orders
const orderRouter = express_1.default.Router();
// Create a route for 1) checkout, which validates stock and returns a formatted basket to be displayed on the checkout page, aswell as returned with the createOrder route
orderRouter.post('/checkout', middlewear_1.parseBasket, middlewear_1.validateBasketStock, (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    // Calculates the total for the products in the basket and formats the basket to return
    const populatedBasket = req.body;
    let totalPrice = 0;
    const basketToReturn = populatedBasket.map(basketItem => {
        const { price, name, _id } = basketItem.product;
        totalPrice += price * basketItem.quantity;
        return {
            product: {
                price, name, id: _id
            },
            quantity: basketItem.quantity
        };
    });
    res.status(200).json({ basket: basketToReturn, totalPrice });
}));
// Order router for creating the paypal order, and a temp order for order validation onApprove()
orderRouter.post('', middlewear_1.authenticateUser, middlewear_1.parseBasket, (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // 1) Proccesses the basket to create the paypal order
        // Throws an error if basket empty, any products not found, or if there is not enough stock on any of the product docs
        const processedBasket = yield (0, helpers_1.processBasket)(req.body);
        // Calls the orderCreate on the paypal controller
        // Will throw error if failed to create order
        const { jsonResponse, httpStatusCode } = yield paypalController_1.default.createOrder(processedBasket);
        const { id: paypalOrderId } = jsonResponse;
        // Starts a session and transaction, within which to complete the stock updates and the processing order creation
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        // Try block for performing the reservations and creating temporary order
        try {
            const reservationOperations = processedBasket.items.map(({ quantity, product }) => {
                return Product_1.default.updateOne({ _id: product.id, stock: { $gte: quantity } }, { $inc: { reserved: quantity, stock: -quantity } }, { session });
            });
            // If any of the updates to the stock did not occur, throw an error
            const results = yield Promise.all(reservationOperations);
            if (results.some(result => result.modifiedCount === 0)) {
                throw new Error('Not enough stock for all operation');
            }
            // Creates the temp order
            const tempOrder = new TempOrder_1.default({
                user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
                items: (0, helpers_1.mapProcessedBasketItemsToOrderItems)(processedBasket),
                totalCost: {
                    currencyCode: 'GBP',
                    value: processedBasket.totalCost
                },
                paymentTransactionId: paypalOrderId
            });
            yield tempOrder.save({ session });
            yield session.commitTransaction();
            // Since paypal order created an reservations made, returns the success to the paypal SDK
            res.status(httpStatusCode).json(jsonResponse);
        }
        catch (error) {
            yield session.abortTransaction();
            console.log('Transaction aborted');
            throw error;
        }
        finally {
            yield session.endSession();
        }
    }
    catch (error) {
        // Handles occurance of any errors throughout process
        let errorMessage = 'Error creating order: ';
        if (error instanceof Error) {
            errorMessage += error.message;
        }
        console.error(errorMessage, error);
        res.status(500).json({ error: errorMessage });
    }
}));
// 3) onApprove which updates stock levels and captures the payment
//   onApprove also needs to update the basket information for the user
//   This is also where a task-queue would be implemented to send confirmation emails
orderRouter.post('/capture/:orderID', middlewear_1.authenticateUser, (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { orderID } = req.params;
    // Try block for validating that the paypal order details match the temp order details
    try {
        const tempOrder = yield TempOrder_1.default.findOne({ user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id, paymentTransactionId: orderID });
        if (!tempOrder) {
            throw new Error('No temp order data found');
        }
        const { purchaseUnits } = yield paypalController_1.default.getOrder(orderID);
        if (!purchaseUnits) {
            throw new Error('Purchase units on paypal order not found');
        }
        // For validating that the items, total cost and currencies on the tempOrder and PurchaseUnits match. 
        // Used for security, throws error with reason message if any mis-match, missing, or too many items
        try {
            (0, helpers_1.validatePurchaseUnitsAgainstTempOrder)(purchaseUnits[0], tempOrder);
        }
        catch (error) {
            let errorMessage = 'Error validating the purchaseUnit against tempOrder items';
            if (error instanceof Error) {
                errorMessage += error.message;
            }
            throw new Error(errorMessage);
        }
        // For attempting to capture the order, throws an error if failed
        const { jsonResponse, httpStatusCode } = yield paypalController_1.default.captureOrder(orderID);
        const { status: paypalOrderStatus, id: paypalOrderId } = jsonResponse;
        // For creating the order document, reducing the stock reservation and deleting the tempOrder in a session
        console.log('session started!');
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // Creates new order
            const newOrder = new Order_1.default({
                user: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
                items: tempOrder.items,
                totalCost: tempOrder.totalCost,
                status: 'PAID',
                payment: {
                    method: 'PAYPAL',
                    status: paypalOrderStatus,
                    transactionId: paypalOrderId
                }
            });
            yield newOrder.save({ session });
            // Deletes the tempOrder
            yield TempOrder_1.default.deleteOne({ _id: tempOrder._id }).session(session);
            // Updates the stock reservation for each of the products
            const reservationUpdates = tempOrder.items.map(item => {
                return Product_1.default.updateOne({ _id: item.product }, { $inc: { reserved: -item.quantity } }, { session });
            });
            // Checks that all the reservation amounts recieved an update
            const results = yield Promise.all(reservationUpdates);
            if (results.some(result => {
                return result.modifiedCount === 0;
            })) {
                throw new Error('One or more reservation updates failed after creating an order!');
            }
            yield session.commitTransaction();
        }
        catch (error) {
            yield session.abortTransaction();
            let errorMessage = 'Error creating an order and aborted transaction: ';
            if (error instanceof Error) {
                errorMessage += error.message;
            }
            throw new Error(errorMessage);
        }
        finally {
            yield session.endSession();
        }
        res.status(httpStatusCode).json(jsonResponse);
    }
    catch (error) {
        let errorMessage = 'Error capturing order: ';
        if (error instanceof Error) {
            errorMessage += error.message;
        }
        console.error(error);
        res.status(500).json({ error: errorMessage });
    }
}));
// 3) onApprove which updates stock levels and captures the payment
// onApprove also needs to update the basket information for the user
// This is also where a task-queue would be implemented to send confirmation emails
// orderRouter.post('/capture/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
//   const { id } = req.params
//   // Busniness logic for checking the stock lev
// })
// Route for retrieving a list of the users orders
orderRouter.get('', middlewear_1.authenticateUser, (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json(['order1', 'order2']);
}));
exports.default = orderRouter;
