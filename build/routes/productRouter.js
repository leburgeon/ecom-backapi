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
const Description_1 = __importDefault(require("../models/Description"));
const zod_1 = require("zod");
const productRouter = express_1.default.Router();
// TODO add filtering based on category or price range
// Route for retrieving the products 
productRouter.get('/', middlewear_1.parsePagination, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { categories, minPrice, maxPrice, inStock } = req.query;
    const filters = {};
    // For adding a filter to only include the filtered categories
    if (categories && zod_1.z.string().array().parse(categories)) {
        console.log('#################################');
        console.log();
        filters.category = {
            $in: categories
        };
    }
    // For adding filters for the min and max values for price if they exist
    if (minPrice && !isNaN(Number(minPrice))) {
        filters.price = Object.assign(Object.assign({}, filters.price), { $gte: Number(minPrice) });
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
        filters.price = Object.assign(Object.assign({}, filters.price), { $lte: Number(maxPrice) });
    }
    // For adding a filter to only return instock items
    if (inStock && inStock === 'true') {
        filters['stock.quantity'] = { $gte: 1 };
    }
    console.log('#################################');
    console.log(filters);
    // Parses the query strings to integers
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    // Retrieves and returns the correct products according to the pagination provided
    try {
        const products = yield Product_1.default.find(filters).limit(limit).skip((page - 1) * limit);
        res.status(200).json(products);
    }
    catch (error) {
        next(error);
    }
}));
// Route for retrieving a single product from the database and populating it
productRouter.get('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const productToReturn = yield Product_1.default.findById(id);
        if (!productToReturn) {
            res.status(404).json('Product not found');
        }
        else {
            yield productToReturn.populate('description');
            res.status(200).json(productToReturn);
        }
    }
    catch (error) {
        next(error);
    }
}));
// Route for deleting a product using the id, requires admin
// Deletes the description associated with the product first
productRouter.delete('/:id', middlewear_1.authenticateAdmin, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield Description_1.default.findOneAndDelete({ product: id });
        yield Product_1.default.findByIdAndDelete(id);
        res.status(204).end();
    }
    catch (error) {
        next(error);
    }
}));
// Route for adding a new product document
productRouter.post('/', middlewear_1.authenticateAdmin, middlewear_1.parseNewProduct, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, category, price, description, inStock } = req.body;
    try {
        // First creates the new product document
        const newProduct = new Product_1.default({ name, category, price, inStock });
        // Then the new description is added for the product
        // Product field is the id of the new product document
        const newProdcutDescription = new Description_1.default({
            content: description,
            product: newProduct._id
        });
        // Description saved
        yield newProdcutDescription.save();
        // Description field of the new product as the new description document id
        newProduct.description = newProdcutDescription._id;
        // Saves the new product document to database
        yield newProduct.save();
        res.status(201).json(newProduct);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = productRouter;
