"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.errorHandler = exports.requestLogger = exports.validateBasketStock = exports.parseBasket = exports.parseProductToBasket = exports.parseFilters = exports.parseNewOrder = exports.parsePagination = exports.parseLoginCredentials = exports.parseNewProduct = exports.parseNewUser = exports.authenticateAdmin = exports.authenticateUser = void 0;
const validators_1 = require("./validators");
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const config_1 = __importDefault(require("./config"));
const User_1 = __importDefault(require("../models/User"));
const zod_2 = require("zod");
const Product_1 = __importDefault(require("../models/Product"));
const Errors_1 = require("./Errors");
// Middlewear for parsing the new request and ensuring that the request has fiels for page limit and page number 
// Middlewear for authenticating a user and extracting the user info into the request
const authenticateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Extracts the authorisation header from the request
    const authorisation = req.get('Authorization');
    // Checks that the token uses the bearer scheme and if not sends the request
    if (!authorisation || !authorisation.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Please provide authentication token with bearer scheme' });
    }
    else {
        try {
            // Attempts to verify the token with the environment secret
            const token = authorisation.replace('Bearer ', '');
            const decoded = jsonwebtoken_1.default.verify(token, config_1.default.SECRET);
            const payload = validators_1.JwtUserPayloadSchema.parse(decoded);
            // Finds the user with the id in the payload
            const userDocument = yield User_1.default.findById(payload.id);
            if (!userDocument) {
                // If the user is not found, response is updates
                res.status(401).send({ error: 'User not found, re-login' });
            }
            else {
                req.user = userDocument;
                next();
            }
        }
        catch (error) {
            console.log('Error thrown during auth');
            next(error);
        }
    }
});
exports.authenticateUser = authenticateUser;
// Middlewear for authenticating an admin
const authenticateAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authorization = req.get('Authorization');
    // Checks that the authorization uses the bearer scheme
    if (!authorization || !authorization.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Please provide auth token with bearer scheme' });
    }
    else {
        const token = authorization.replace('Bearer ', '');
        try {
            // Verifies the token whilst decoding the payload
            const decoded = jsonwebtoken_1.default.verify(token, config_1.default.SECRET);
            const payload = validators_1.JwtUserPayloadSchema.parse(decoded);
            // Attempts to find an admin account with the id in the payload
            const adminUser = yield User_1.default.findOne({ _id: payload.id, isAdmin: true });
            if (!adminUser) {
                res.status(401).json({ error: 'Admin user not found' });
            }
            else {
                next();
            }
        }
        catch (error) {
            next(error);
        }
    }
});
exports.authenticateAdmin = authenticateAdmin;
// Middlewear for parsing the request body before creating a new user
const parseNewUser = (req, _res, next) => {
    try {
        validators_1.NewUserSchema.parse(req.body);
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.parseNewUser = parseNewUser;
// Middlewear for parsing the request body for the fields required for a new product
const parseNewProduct = (req, _res, next) => {
    try {
        validators_1.NewProductSchema.parse(req.body);
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.parseNewProduct = parseNewProduct;
// For parsing the request body for the login credentials
const parseLoginCredentials = (req, _res, next) => {
    try {
        validators_1.LoginCredentialsSchema.parse(req.body);
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.parseLoginCredentials = parseLoginCredentials;
// For parsing the query attribute on the express request for pagination details
const parsePagination = (req, _res, next) => {
    try {
        validators_1.PaginationDetailsSchema.parse(req.query);
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.parsePagination = parsePagination;
// For parsing the request body a new order
const parseNewOrder = (req, _res, next) => {
    try {
        validators_1.NewOrderSchema.parse(req.body);
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.parseNewOrder = parseNewOrder;
// Middlewear for parsing the filter information for a search request
const parseFilters = (req, _res, next) => {
    const { category, minPrice, maxPrice, inStockOnly, query } = req.query;
    const filters = {};
    // For adding a filter for the search query
    if (query && zod_2.z.string().safeParse(query)) {
        filters.name = {
            $regex: query,
            $options: "i"
        };
    }
    // For adding a filter to only include results that contain the given category in their list
    if (category && zod_2.z.string().safeParse(category)) {
        if (category !== 'null') {
            filters.categories = {
                $in: [category]
            };
        }
    }
    // For adding filters for the min and max values for price if they exist
    if (minPrice && !isNaN(Number(minPrice))) {
        filters.price = Object.assign(Object.assign({}, filters.price), { $gte: Number(minPrice) });
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
        filters.price = Object.assign(Object.assign({}, filters.price), { $lte: Number(maxPrice) });
    }
    // For adding a filter to only return instock items
    if (inStockOnly && inStockOnly === 'true') {
        filters['stock'] = { $gte: 1 };
    }
    req.filters = filters;
    next();
};
exports.parseFilters = parseFilters;
// Middlewear for parsing the required info for adding an item to the basket
const parseProductToBasket = (req, _res, next) => {
    if (!mongoose_1.default.isValidObjectId(req.body.productId) || isNaN(parseInt(req.body.quantity))) {
        next(new Error('Must include valid productId and quantity for adding or removing from basket'));
    }
    next();
};
exports.parseProductToBasket = parseProductToBasket;
// Middlewear for parsing a basket from the request body
const parseBasket = (req, _res, next) => {
    try {
        validators_1.BasketSchema.parse(req.body);
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.parseBasket = parseBasket;
// Method for async validating stock, and returning an object with the results
const validateBasketAndPopulate = (basket) => __awaiter(void 0, void 0, void 0, function* () {
    // Checks the stock for all the items in the basket and returns an array of promises for these checks
    const promiseArrayOfStockChecks = basket.map((item) => __awaiter(void 0, void 0, void 0, function* () {
        const product = yield Product_1.default.findById(item.id);
        if (!product) {
            throw new Errors_1.StockError('Product not found', item.id);
        }
        if (product.stock < item.quantity) {
            throw new Errors_1.StockError('Out of stock', item.id);
        }
        return { quantity: item.quantity,
            product,
        };
    }));
    // Once resolved, an array of the results of each of these checks
    const stockCheckResults = yield Promise.allSettled(promiseArrayOfStockChecks);
    // Object for storing the ids of not found or out of stock products
    const missingStock = {
        notFound: new Array(),
        outOfStock: new Array()
    };
    // Array for storing the populated and validated items
    const populatedItems = new Array();
    // Itterates over the results, adding any ids to the correct arrays in the stock results
    stockCheckResults.forEach(result => {
        if (result.status === 'rejected') {
            const error = result.reason;
            if (error instanceof Errors_1.StockError) {
                if (error.message === 'Out of stock') {
                    missingStock.outOfStock.push(error.id);
                }
                else if (error.message === 'Product not found') {
                    missingStock.notFound.push(error.id);
                }
            }
        }
        else {
            populatedItems.push(result.value);
        }
    });
    return { missingStock, populatedItems };
});
// Middlewear for validating the stock levels and product ids from a basket [{id, quantity}]
const validateBasketStock = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const basket = req.body;
    // Handles empty basket case
    if (basket.length === 0) {
        res.status(500).json({ error: 'Basket was empty' });
    }
    else {
        const { missingStock, populatedItems } = yield validateBasketAndPopulate(basket);
        if (missingStock.notFound.length > 0) {
            res.status(500).json({ error: 'Some products not found',
                ids: missingStock.notFound
            });
        }
        else if (missingStock.outOfStock.length > 0) {
            res.status(400).json({ error: 'Some products out of stock',
                ids: missingStock.outOfStock
            });
        }
        else {
            req.body = populatedItems;
            next();
        }
    }
});
exports.validateBasketStock = validateBasketStock;
const requestLogger = (req, _res, next) => {
    const method = req.method;
    const url = req.originalUrl;
    const body = req.body;
    console.log(`Method: ${method} Url: ${url} Body: ${body}`);
    next();
};
exports.requestLogger = requestLogger;
// Error handler for the application
const errorHandler = (error, _req, res, _next) => {
    if (error instanceof mongoose_1.default.Error.ValidationError) { // For handling a mongoose validation error
        res.status(400).json({ error: error.message });
    }
    else if (error instanceof mongoose_1.default.Error.CastError) { // For handling mongoose cast error
        res.status(400).json({ error: error.message });
    }
    else if (error.code === 11000 && error instanceof Error) { // For handling mongo duplicate key error
        res.status(409).json({ error: 'Duplicate Key Error: ' + error.message });
    }
    else if (error instanceof zod_1.ZodError) { // For handling duplicate key error
        res.status(400).json({ error: error.issues });
    }
    else if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
        res.status(401).json({ error: `${error.name}:${error.message}` });
    }
    else if (error instanceof jsonwebtoken_1.TokenExpiredError) {
        res.status(400).json({ error: 'Token expired, please re-login' });
    }
    else if (error instanceof Error && error.message === 'Must include valid productId and quantity for adding or removing from basket') {
        res.status(401).json({ error: error.message });
    }
    else {
        console.log('unhandled error case');
        console.error(error);
        let errorMessage = 'Internal server error and unhandled error case: ';
        if (error instanceof Error) {
            errorMessage += error.message;
        }
        res.status(500).json({ error: errorMessage });
    }
};
exports.errorHandler = errorHandler;
