"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.totalCostSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.totalCostSchema = new mongoose_1.default.Schema({
    currencyCode: {
        type: String,
        required: true
    },
    value: {
        type: Number,
        required: true
    }
}, { _id: false });
const tempOrderSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true
    },
    items: [
        {
            product: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            name: {
                type: String,
                required: true
            }
        }
    ],
    totalCost: {
        type: exports.totalCostSchema,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    paymentTransactionId: String
}, { timestamps: true });
exports.default = mongoose_1.default.model('TempOrder', tempOrderSchema);
