"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const TempOrder_1 = require("./TempOrder");
const orderSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderNumber: {
        type: String,
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
        type: TempOrder_1.totalCostSchema,
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
}, { timestamps: true,
    toJSON: {
        transform(_doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.shippingAddress;
            delete ret.payment;
            delete ret.__v;
        }
    }
});
exports.default = mongoose_1.default.model('Order', orderSchema);
