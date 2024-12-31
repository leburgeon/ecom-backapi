"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const descriptionSchema = new mongoose_1.default.Schema({
    content: {
        type: String,
        minLength: 10,
        required: true
    },
    product: {
        type: mongoose_1.default.Types.ObjectId,
        required: true
    }
});
descriptionSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = document._id;
        delete returnedObject.product;
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});
exports.default = mongoose_1.default.model('Description', descriptionSchema);
