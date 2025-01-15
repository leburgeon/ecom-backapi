"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewOrderSchema = exports.PaginationDetailsSchema = exports.JwtUserPayloadSchema = exports.LoginCredentialsSchema = exports.NewProductSchema = exports.NewUserSchema = void 0;
const zod_1 = require("zod");
exports.NewUserSchema = zod_1.z.object({
    name: zod_1.z.string(),
    username: zod_1.z.string().trim().min(5).toLowerCase(),
    password: zod_1.z.string().min(5)
});
exports.NewProductSchema = zod_1.z.object({
    name: zod_1.z.string(),
    category: zod_1.z.string(),
    price: zod_1.z.coerce.number(),
    description: zod_1.z.string().min(10),
    inStock: zod_1.z.coerce.boolean()
});
exports.LoginCredentialsSchema = zod_1.z.object({
    username: zod_1.z.string(),
    password: zod_1.z.string()
});
exports.JwtUserPayloadSchema = zod_1.z.object({
    username: zod_1.z.string(),
    name: zod_1.z.string(),
    id: zod_1.z.string()
});
exports.PaginationDetailsSchema = zod_1.z.object({
    page: zod_1.z.coerce.number(),
    limit: zod_1.z.coerce.number()
});
exports.NewOrderSchema = zod_1.z.object({
    products: zod_1.z.object({
        id: zod_1.z.string(),
        quantity: zod_1.z.coerce.number()
    }).array(),
    total: zod_1.z.coerce.number()
});
