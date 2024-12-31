"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const middlewear_1 = require("./utils/middlewear");
const userRouter_1 = __importDefault(require("./routes/userRouter"));
const loginRouter_1 = __importDefault(require("./routes/loginRouter"));
const productRouter_1 = __importDefault(require("./routes/productRouter"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get('/ping', (_req, res) => {
    res.send('pong');
});
app.use('/api/users', userRouter_1.default);
app.use('/api/login', loginRouter_1.default);
app.use('/api/products', productRouter_1.default);
app.use((_req, res) => {
    res.status(400).json({ error: 'Uknown endpoint' });
});
app.use(middlewear_1.errorHandler);
exports.default = app;
