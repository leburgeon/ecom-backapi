"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const productSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    inStock: {
        type: Boolean,
        required: true,
        default: false
    },
    description: {
        type: mongoose_1.default.Types.ObjectId,
        required: true,
        ref: 'Description'
    }
});
productSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = document._id.toString();
        returnedObject.description = returnedObject.description.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});
exports.default = mongoose_1.default.model('Product', productSchema);
