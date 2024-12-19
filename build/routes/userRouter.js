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
userRouter.get('/', middlewear_1.authenticateAdmin, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Authenticated user: ', req.user);
    try {
        const allUsers = yield User_1.default.find({});
        res.status(200).json(allUsers);
    }
    catch (error) {
        next(error);
    }
}));
// TODO Route for getting the data for a single user, returns the user and populated order data
// Route for adding a new user
userRouter.post('/', middlewear_1.parseNewUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, username, password } = req.body;
    const passwordHash = yield bcryptjs_1.default.hash(password, 10);
    try {
        const newUser = new User_1.default({ name, username, passwordHash, isAdmin: false });
        yield newUser.save();
        res.status(201).json(newUser);
    }
    catch (error) {
        next(error);
    }
}));
// Route for adding a new admin user, request must be authenticated as coming from an existing admin
userRouter.post('/admin', middlewear_1.authenticateAdmin, middlewear_1.parseNewUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, username, password } = req.body;
    const passwordHash = yield bcryptjs_1.default.hash(password, 10);
    try {
        const newUser = new User_1.default({ name, username, passwordHash, isAdmin: true });
        yield newUser.save();
        res.status(201).json({ newUser });
    }
    catch (error) {
        next(error);
    }
}));
// Route for deleting a user
userRouter.delete('/:id', middlewear_1.authenticateUser, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO add check that the use is authorised to delete this user
    // Id of the user to delete
    const { id } = req.params;
    try {
        yield User_1.default.deleteOne({ _id: id });
        res.status(200).end();
    }
    catch (error) {
        next(error);
    }
}));
exports.default = userRouter;
