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
const Errors_1 = require("../utils/Errors");
const basketRouter = express_1.default.Router();
// Route for getting the populated basket information of the user
basketRouter.get('', middlewear_1.authenticateUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Populates the items array on the basket
        const userBasket = yield Basket_1.default.findOne({ user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id }).populate('products.productId', 'name price stock firstImage');
        const productsArray = userBasket === null || userBasket === void 0 ? void 0 : userBasket.products.map(product => {
            // The product id field is now a populated mongoose document
            return {
                product: product.productId,
                quantity: product.quantity
            };
        });
        res.status(200).json({ basket: productsArray });
    }
    catch (error) {
        console.error('Error fetching user basket', error);
        next(error);
    }
}));
// Router for adding stock to the basket - should check if there is enough to make the change 
basketRouter.post('/increment', middlewear_1.authenticateUser, middlewear_1.parseProductToBasket, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Try block responsible for calculating the udpate that needs to happen
    try {
        const userDoc = req.user;
        const { productId: id, quantity: quantityString } = req.body;
        const quantity = parseInt(quantityString);
        // Retrieve the product document
        const productToIncrement = yield Product_1.default.findById(id);
        // Ensure exists
        if (!productToIncrement) {
            throw new Error('Product not found');
        }
        // Retrieve the basket document
        let userBasket = yield Basket_1.default.findOne({ user: userDoc === null || userDoc === void 0 ? void 0 : userDoc._id.toString() });
        // Ensure exists 
        if (!userBasket) {
            // Creates one if not
            userBasket = new Basket_1.default({ user: userDoc === null || userDoc === void 0 ? void 0 : userDoc._id });
        }
        //  Initialise a variable for storing the desired quantity
        let desiredQuantity = undefined;
        // If the product is already in the basket, set the desired quantity using the existing amount and the increment
        userBasket.products.forEach(product => {
            if (product.productId.toString() === id) {
                desiredQuantity = product.quantity + quantity;
            }
        });
        // Else, set the desiredQuantity to the increment
        if (desiredQuantity === undefined) {
            desiredQuantity = quantity;
        }
        // Try block responsible for updating the document and saving
        try {
            // Check if the desiredQuantity is less than 1
            if (desiredQuantity < 1) {
                // If it is, filter the product from the basket
                userBasket.set('products', userBasket.products.filter(p => p.productId.toString() !== productToIncrement._id.toString()));
                // Else
            }
            else {
                // Check if the new value is valid (there is enough stock to potentially fulfill the order, or the increment was negative)
                if (desiredQuantity <= productToIncrement.stock || quantity < 0) {
                    // If it is valid, update the quantitiy on the basket item if it exists
                    const wasThere = userBasket.products.some(product => {
                        if (product.productId.toString() === productToIncrement._id.toString()) {
                            product.quantity = desiredQuantity;
                            return true;
                        }
                        return false;
                    });
                    // If it was not there already, add new item to the basket
                    if (!wasThere) {
                        userBasket.products.push({ productId: productToIncrement._id, quantity: desiredQuantity });
                    }
                }
                else {
                    // Else, throw an error, with the id and the stock quantity
                    throw new Errors_1.StockError('Not enough stock', id, productToIncrement.stock);
                }
            }
            // Save the updated basket
            yield userBasket.save();
            // Responds with the number of unique items in the basket
            res.status(200).json({ basketCount: userBasket.products.length,
                inBasket: desiredQuantity,
                items: new Array({ id: productToIncrement._id.toString(), quantity: productToIncrement.stock }) });
        }
        catch (error) {
            // If stock error, return id and latest stock of the violating product
            if (error instanceof Errors_1.StockError) {
                res.status(400).json({
                    error: error.message,
                    items: new Array({ id: productToIncrement._id.toString(), quantity: productToIncrement.stock })
                });
            }
            else {
                throw error;
            }
        }
    }
    catch (error) {
        next(error);
    }
}));
// Route for removing an item from the basket entirely
basketRouter.delete('/:id', middlewear_1.authenticateUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const productToRemove = yield Product_1.default.findById(req.params.id);
        if (productToRemove) {
            // Perform an update operation on the products array, for the basket document with the matching user id
            yield Basket_1.default.updateOne({ user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id }, { $pull: { products: { productId: productToRemove._id } } });
        }
        // Calculates the number of unique items in the basket
        const userBasket = yield Basket_1.default.findOne({ user: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id });
        const basketCount = userBasket === null || userBasket === void 0 ? void 0 : userBasket.products.length;
        res.status(200).json({ basketCount });
    }
    catch (error) {
        console.error('Error removing from basket entirely', error);
        next(error);
    }
}));
exports.default = basketRouter;
