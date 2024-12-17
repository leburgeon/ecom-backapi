"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewUserSchema = void 0;
const zod_1 = require("zod");
exports.NewUserSchema = zod_1.z.object({
    name: zod_1.z.string(),
    username: zod_1.z.string().trim().min(5).toLowerCase(),
    password: zod_1.z.string().min(5)
});
