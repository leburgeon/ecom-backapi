"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.parseNewUser = void 0;
const validators_1 = require("./validators");
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const parseNewUser = (req, _res, next) => {
    try {
        validators_1.NewUserSchema.parse(req.body);
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.parseNewUser = parseNewUser;
const errorHandler = (error, _req, res, _next) => {
    if (error instanceof mongoose_1.default.Error.ValidationError) { // For handling a mongoose validation error
        res.status(400).json({ error: error.message });
    }
    else if (error instanceof mongoose_1.default.Error.CastError) { // For handling mongoose cast error
        res.status(400).json({ error: error.message });
    }
    else if (error.code === 11000 && error instanceof Error) { // For handling mongo duplicate key error
        res.status(409).json({ error: 'Duplicate Key Error: ' + error.message });
    }
    else if (error instanceof zod_1.ZodError) { // For handling duplicate key error
        res.status(400).json({ error: error.issues });
    }
    else {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.errorHandler = errorHandler;
