"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const middlewear_1 = require("../utils/middlewear");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userRouter = express_1.default.Router();
// Route for returning a list of the users in the database
userRouter.get('/', (_req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allUsers = yield User_1.default.find({});
        res.status(200).json(allUsers);
    }
    catch (error) {
        next(error);
    }
}));
// Route for adding a new user
userRouter.post('/', middlewear_1.parseNewUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, username, password } = req.body;
    const passwordHash = yield bcryptjs_1.default.hash(password, 10);
    try {
        const newUser = new User_1.default({ name, username, passwordHash });
        yield newUser.save();
        res.status(201).json(newUser);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = userRouter;
