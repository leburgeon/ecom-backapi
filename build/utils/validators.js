"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasketSchema = exports.NewOrderSchema = exports.ObjectIdSchema = exports.PaginationDetailsSchema = exports.JwtUserPayloadSchema = exports.LoginCredentialsSchema = exports.NewProductSchema = exports.NewUserSchema = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
exports.NewUserSchema = zod_1.z.object({
    name: zod_1.z.string(),
    email: zod_1.z.string().email().trim().toLowerCase(),
    password: zod_1.z.string().min(5)
});
exports.NewProductSchema = zod_1.z.object({
    name: zod_1.z.string(),
    categories: zod_1.z.string().array(),
    price: zod_1.z.coerce.number(),
    description: zod_1.z.string().min(10),
    initialStock: zod_1.z.coerce.number(),
    firstImage: zod_1.z.string().url(),
    seller: zod_1.z.string()
});
exports.LoginCredentialsSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase().trim(),
    password: zod_1.z.string()
});
exports.JwtUserPayloadSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase().trim(),
    name: zod_1.z.string(),
    id: zod_1.z.string()
});
exports.PaginationDetailsSchema = zod_1.z.object({
    page: zod_1.z.coerce.number(),
    limit: zod_1.z.coerce.number()
});
exports.ObjectIdSchema = zod_1.z.string().refine(val => mongoose_1.default.Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId'
});
exports.NewOrderSchema = zod_1.z.object({
    products: zod_1.z.object({
        id: exports.ObjectIdSchema,
        quantity: zod_1.z.coerce.number()
    }).array()
});
exports.BasketSchema = zod_1.z.object({
    id: exports.ObjectIdSchema,
    quantity: zod_1.z.coerce.number()
}).array();
