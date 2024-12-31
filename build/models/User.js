"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    username: {
        type: String,
        minLength: 5,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
    },
    orders: {
        type: [mongoose_1.default.Schema.Types.ObjectId],
        default: [],
        ref: 'Order'
    },
    passwordHash: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
});
userSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = document._id.toString(),
            delete returnedObject._id;
        delete returnedObject.__v;
        delete returnedObject.passwordHash;
        delete returnedObject.isAdmin;
        delete returnedObject.orders;
    }
});
const User = mongoose_1.default.model('User', userSchema);
exports.default = User;
