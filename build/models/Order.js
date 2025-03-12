"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const orderSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
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
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: 'PENDING',
        enum: {
            values: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']
        }
    },
    payment: {
        method: String,
        status: String,
        transactionId: String
    },
    shippingAddress: {
        fullName: String,
        address: String,
        city: String,
        postalCode: String,
        country: String
    }
}, { timestamps: true });
exports.default = mongoose_1.default.model('Order', orderSchema);
