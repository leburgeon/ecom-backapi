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
const Basket_1 = __importDefault(require("../models/Basket"));
const Product_1 = __importDefault(require("../models/Product"));
const basketRouter = express_1.default.Router();
// Route for getting the basket information of the user
basketRouter.post('/add', middlewear_1.authenticateUser, middlewear_1.parseProductToBasket, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userDoc = req.user;
    const productToAddId = req.body.productId;
    const quantityToAdd = parseInt(req.body.quantity);
    // First ensures that the objectId corresponds to a valid product
    const productToAdd = yield Product_1.default.findById(productToAddId);
    if (!productToAdd) {
        const errorMessage = `Error finding the product with the id ${productToAddId}`;
        res.status(404).json({ error: errorMessage });
    }
    else {
        try {
            // Attempts to find the basket associated with the user
            let usersBasket = yield Basket_1.default.findOne({ user: userDoc === null || userDoc === void 0 ? void 0 : userDoc._id });
            // If no basket is found, a basket is created for that user with the item to add
            if (!usersBasket) {
                usersBasket = new Basket_1.default({ user: userDoc === null || userDoc === void 0 ? void 0 : userDoc._id });
                yield usersBasket.save();
            }
            // Itterates over the array of products already in the basket
            let wasInBasket = false;
            usersBasket.products.forEach(product => {
                // If the product exists in the basket already, increases the quantity by requested amount
                if (product.productId.toString() === productToAdd._id.toString()) {
                    product.quantity += quantityToAdd;
                    wasInBasket = true;
                }
            });
            // If the product was not in the basket, adds a new product object to the array of products
            if (!wasInBasket) {
                usersBasket.products.push({
                    productId: productToAdd._id,
                    quantity: quantityToAdd
                });
            }
            // Saves the basket after changes
            yield usersBasket.save();
            const productsNowInBasket = usersBasket.products.length;
            // Confirms the add to the frontend, with the amount of products now in the basket
            res.status(200).json({ basketCount: productsNowInBasket });
        }
        catch (error) {
            console.error('Error adding product to basket', error);
            next(error);
        }
    }
}));
basketRouter.post('/reduce', middlewear_1.authenticateUser, middlewear_1.parseProductToBasket, (req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const userDoc = req.user;
    const productToReduceId = req.body.productId;
    const quantityToRemove = parseInt(req.body.quantity);
    try {
        // First attempts to find the product
        const productToReduce = yield Product_1.default.findById(productToReduceId);
        if (!productToReduce) {
            // If not found, respond with 404 not found
            res.status(404).json({ error: 'Product to reduce from basket not found' });
        }
        else {
            // Attempts to find the user basket
            const userBasket = yield Basket_1.default.findOne({ user: userDoc === null || userDoc === void 0 ? void 0 : userDoc._id });
            // If no basket exists, no need to remove item
            if (!userBasket) {
                res.status(200);
            }
            else {
                // Uses a mongoDB query to update the product array 
                // Breakdown: the first object argument is the query selector, which is used to:
                // 1: Select the document 
                // 2: specify a condition on array elements which is utilised by the $ operator
                yield Basket_1.default.updateOne({ _id: userBasket._id, 'products.productId': productToReduce._id }, 
                // The second object argument is the update operation
                // In this example, the $inc update operator is used alongside the $ operator to affect only the first matching element
                // The '.' operator is subsequantly used to identify which field of the object to affect
                {
                    $inc: { 'products.$.quantity': -quantityToRemove },
                    // The second field of this update operation is used to remove elements in the products array, whos condition is met
                    $pull: { products: { quantity: { $lte: 1 } } }
                });
                const usersBasketAfter = yield Basket_1.default.findById(userBasket._id);
                res.status(200).json({ basketCount: usersBasketAfter === null || usersBasketAfter === void 0 ? void 0 : usersBasketAfter.products.length });
            }
        }
    }
    catch (error) {
        console.error('SOMTHING WRONG REDUCING FROM BASKET', error);
        res.status(500).json({
            error: 'There was an error removing this from the basket'
        });
    }
}));
exports.default = basketRouter;
