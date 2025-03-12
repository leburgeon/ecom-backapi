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
exports.processBasket = void 0;
const Product_1 = __importDefault(require("../models/Product"));
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
    return processedBasket;
});
exports.processBasket = processBasket;
