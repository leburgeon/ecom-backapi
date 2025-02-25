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
    const productToAddQuantity = parseInt(req.body.quantity);
    // First ensures that the objectId corresponds to a valid product
    const productToAdd = yield Product_1.default.findById(productToAddId);
    if (!productToAdd) {
        const errorMessage = `Error finding the product with the id ${productToAddId}`;
        console.log(errorMessage);
        res.status(404).json({ error: errorMessage });
        next();
    }
    // Attempts to find the basket associated with the user
    let usersBasket = yield Basket_1.default.findOne({ user: userDoc === null || userDoc === void 0 ? void 0 : userDoc._id });
    // If no basket is found, a basket is created for that user with the item to add
    if (!usersBasket) {
        try {
            userBasket = new Basket_1.default({ user: userDoc === null || userDoc === void 0 ? void 0 : userDoc._id });
        }
        finally {
        }
    }
}));
exports.default = basketRouter;
