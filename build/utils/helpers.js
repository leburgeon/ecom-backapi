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
exports.generateOrderNumber = exports.createSessionAndReleaseStock = exports.creatSessionAndHandleStockCleanup = exports.validatePurchaseUnitsAgainstTempOrder = exports.mapProcessedBasketItemsToPurchaseUnitItems = exports.mapProcessedBasketItemsToOrderItems = exports.processBasket = void 0;
const Product_1 = __importDefault(require("../models/Product"));
const paypal_server_sdk_1 = require("@paypal/paypal-server-sdk");
const mongoose_1 = __importDefault(require("mongoose"));
const TempOrder_1 = __importDefault(require("../models/TempOrder"));
const Order_1 = __importDefault(require("../models/Order"));
const processBasket = (basket) => __awaiter(void 0, void 0, void 0, function* () {
    // If the basket is empty, returns error
    if (basket.length === 0) {
        throw new Error('Basket was empty');
    }
    // Joins any basket items with the same id using a map
    // This prevents error where same document updated in same transaction
    const basketItems = new Map();
    for (const item of basket) {
        const exists = basketItems.get(item.id);
        if (exists) {
            basketItems.set(item.id, exists + item.quantity);
        }
        else {
            basketItems.set(item.id, item.quantity);
        }
    }
    // Finds all the documents associated with the ids in the basket
    const uniqueIds = Array.from(basketItems.keys());
    const productDocsForCalculatingTotal = yield Product_1.default.find({ _id: { $in: uniqueIds } });
    if (productDocsForCalculatingTotal.length !== uniqueIds.length) {
        throw new Error('Some product ids invalid');
    }
    // For storing array of items in the basket that are in the created order alongside a processed total
    const processedBasket = {
        items: new Array(),
        totalCost: 0
    };
    // If all valid ids and products found, processes the basket using the product docs, appending the total
    // Throws an error if any of the products have less stock than the required quantity
    productDocsForCalculatingTotal.forEach(productDoc => {
        const idString = productDoc._id.toString();
        const quantity = basketItems.get(idString) || 0;
        if (quantity > productDoc.stock) {
            throw new Error('Not enough stock');
        }
        else {
            const price = productDoc.price;
            processedBasket.totalCost += price * quantity;
            processedBasket.items.push({
                product: {
                    id: idString,
                    name: productDoc.name,
                    price: price
                },
                quantity
            });
        }
    });
    // Handles floating point precision conversion
    processedBasket.totalCost = parseFloat(processedBasket.totalCost.toFixed(2));
    return processedBasket;
});
exports.processBasket = processBasket;
const mapProcessedBasketItemsToOrderItems = (basket) => {
    return basket.items.map(item => ({
        product: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
    }));
};
exports.mapProcessedBasketItemsToOrderItems = mapProcessedBasketItemsToOrderItems;
const mapProcessedBasketItemsToPurchaseUnitItems = (basket) => {
    const { totalCost, items } = basket;
    const itemArray = items.map(item => {
        return {
            name: item.product.name,
            unitAmount: {
                currencyCode: "GBP",
                value: item.product.price.toString()
            },
            quantity: item.quantity.toString(),
            sku: item.product.id
        };
    });
    // Create the collect object
    return {
        intent: paypal_server_sdk_1.CheckoutPaymentIntent.Capture,
        purchaseUnits: [
            {
                amount: {
                    currencyCode: 'GBP',
                    value: totalCost.toString(),
                    breakdown: { itemTotal: {
                            currencyCode: 'GBP',
                            value: totalCost.toString()
                        } }
                },
                items: itemArray
            }
        ]
    };
};
exports.mapProcessedBasketItemsToPurchaseUnitItems = mapProcessedBasketItemsToPurchaseUnitItems;
const validatePurchaseUnitsAgainstTempOrder = (purchaseUnit, tempOrder) => {
    const { amount } = purchaseUnit;
    if (!amount) {
        throw new Error('Purchase unit amount was not defined');
    }
    const { value, currencyCode } = amount;
    if (Number.parseFloat(value) !== tempOrder.totalCost.value) {
        throw new Error('Purchase unit and temp order had differing total amounts');
    }
    if (currencyCode !== tempOrder.totalCost.currencyCode) {
        throw new Error('Currencies were not the same');
    }
    const { items } = purchaseUnit;
    if (!items) {
        throw new Error('No items to validate in purchase units!');
    }
    if (items.length !== tempOrder.items.length) {
        throw new Error('Item arrays had differing lengths');
    }
    // Hash map for each of the purchase unit items, with the sku(documentId as the key)
    const purchaseUnitItemsMap = new Map();
    // Sets the map values
    items.forEach((item) => {
        const { unitAmount, sku, name, quantity } = item;
        purchaseUnitItemsMap.set(sku, {
            name, quantity: Number.parseFloat(quantity), price: Number.parseFloat(unitAmount.value)
        });
    });
    for (let item of tempOrder.items) {
        const ofPurchaseUnit = purchaseUnitItemsMap.get(item.product.toString());
        if (!ofPurchaseUnit) {
            throw new Error('Could not find a matching id for one of the items in temporder, arrays did not match');
        }
        if (ofPurchaseUnit.name !== item.name || ofPurchaseUnit.price !== item.price || ofPurchaseUnit.quantity !== item.quantity) {
            throw new Error('Some information of the items did not match (name?/price?/quantity?/');
        }
    }
};
exports.validatePurchaseUnitsAgainstTempOrder = validatePurchaseUnitsAgainstTempOrder;
const handleReservationAndBasketCleanupWithinSession = (session, userId, tempOrder) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Array of operation object for bulkWrite
        const bulkOps = tempOrder.items.map(({ product, quantity }) => {
            return {
                updateOne: {
                    filter: { _id: product, reserved: { $gte: quantity } },
                    update: { $inc: { reserved: -quantity } }
                }
            };
        });
        // Bulk writes updates in order, terminating at first error
        const bulkWriteOpResult = yield Product_1.default.bulkWrite(bulkOps, { session, ordered: true });
        // Ensures that all the updates executed
        if (bulkWriteOpResult.modifiedCount !== tempOrder.items.length) {
            throw new Error('Error updating reserved stock, not all updates executed');
        }
        // Following successful stock reservation reduction, delete the temporder document
        yield TempOrder_1.default.deleteOne({ _id: tempOrder._id, user: userId });
    }
    catch (error) {
        let errorMessage = 'Error handling reservation and basket cleanup: ';
        if (error instanceof Error) {
            errorMessage += error.message;
        }
        throw new Error(errorMessage);
    }
});
const creatSessionAndHandleStockCleanup = (userId, tempOrder) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('session started!');
    try {
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            yield handleReservationAndBasketCleanupWithinSession(session, userId, tempOrder);
            yield session.commitTransaction();
        }
        catch (error) {
            yield session.abortTransaction();
            // TODO! Add the necessary action to the queue- tempOrder deletion will always be atomic with reservedStock removal
            throw error;
        }
        finally {
            yield session.endSession();
        }
    }
    catch (error) {
        // TODO ADD TASK TO QUEUE FOR STOCK CLEANUP
        console.error(error);
    }
});
exports.creatSessionAndHandleStockCleanup = creatSessionAndHandleStockCleanup;
const createSessionAndReleaseStock = (tempOrderToRemove) => __awaiter(void 0, void 0, void 0, function* () {
    // Starts the transaction for deleting the temp order and releasing the stock
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // Array of bulk operations for releasing the reserved stock of the products
        const bulkOps = tempOrderToRemove.items.map(item => {
            return {
                updateOne: {
                    filter: { _id: item.product, reserved: { $gte: item.quantity } },
                    update: { $inc: { stock: item.quantity, reserved: -item.quantity } }
                }
            };
        });
        // Deletes the tempOrder document
        const result = yield TempOrder_1.default.deleteOne({ _id: tempOrderToRemove._id }).session(session);
        // If it was already deleted, abort the transaction, nothing to do
        if (result.deletedCount !== 1) {
            throw new Error('Temp order already deleted');
        }
        // Attempts to release the stock 
        const bulkWriteOpResult = yield Product_1.default.bulkWrite(bulkOps, { session, ordered: true });
        if (bulkWriteOpResult.modifiedCount !== tempOrderToRemove.items.length) {
            throw new Error('Stock not released successfully for every product');
        }
        yield session.commitTransaction();
    }
    catch (error) {
        yield session.abortTransaction();
        let errorMessage = 'Error releasing reserved stock data: ';
        if (error instanceof Error) {
            errorMessage += error.message;
        }
        console.error(errorMessage, error);
    }
    finally {
        yield session.endSession();
    }
});
exports.createSessionAndReleaseStock = createSessionAndReleaseStock;
// Generates a unique order number, using the current date and a hex string. 
// Checks that the id is unique on the database and recursively generates until a new one is found 
const generateOrderNumber = () => __awaiter(void 0, void 0, void 0, function* () {
    const datePart = new Date().toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD
    const randomValues = new Uint8Array(3);
    crypto.getRandomValues(randomValues);
    const hexString = [...randomValues].map(byte => byte.toString(16).padStart(2, '0')).join('');
    const orderNumber = `ORD-${datePart}-${hexString}`;
    // Ensures uniqueness
    const existing = yield Order_1.default.findOne({ orderNumber });
    if (existing) {
        return (0, exports.generateOrderNumber)();
    }
    return orderNumber;
});
exports.generateOrderNumber = generateOrderNumber;
