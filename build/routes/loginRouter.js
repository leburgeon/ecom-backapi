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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const middlewear_1 = require("../utils/middlewear");
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const config_1 = __importDefault(require("../utils/config"));
const loginRouter = express_1.default.Router();
// Router for handing login requests
loginRouter.post('/', middlewear_1.parseLoginCredentials, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        // Attempts to find the user and compares the provided password to the password hash
        const authenticatingUser = yield User_1.default.findOne({ email });
        if (!authenticatingUser || !(yield bcryptjs_1.default.compare(password, authenticatingUser.passwordHash))) {
            // If the user is not found or the password is incorrect sends the error message
            res.status(400).send({ error: "email/password combination incorrect" });
        }
        else {
            // The payload to include in the token, expires in 4h
            const payload = {
                email: authenticatingUser.email,
                name: authenticatingUser.name,
                id: authenticatingUser._id.toString()
            };
            // Signs the token and sends as the body of the response with status 200
            const token = jsonwebtoken_1.default.sign(payload, config_1.default.SECRET, { expiresIn: 3600 * 4 });
            res.status(200).json({
                email: authenticatingUser.email,
                name: authenticatingUser.name,
                token
            });
        }
    }
    catch (error) {
        next(error);
    }
}));
exports.default = loginRouter;
