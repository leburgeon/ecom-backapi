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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const paypal_server_sdk_1 = require("@paypal/paypal-server-sdk");
const config_1 = __importDefault(require("./config"));
const helpers_1 = require("./helpers");
const client = new paypal_server_sdk_1.Client({
    clientCredentialsAuthCredentials: {
        oAuthClientId: config_1.default.PAYPALCLIENTID,
        oAuthClientSecret: config_1.default.PAYPALCLIENTSECRET
    },
    environment: paypal_server_sdk_1.Environment.Sandbox
});
const ordersController = new paypal_server_sdk_1.OrdersController(client);
//const _paymentController = new PaymentsController(client)
// Method for creating order
const createOrder = (basket) => __awaiter(void 0, void 0, void 0, function* () {
    const collect = {
        body: (0, helpers_1.mapProcessedBasketItemsToPurchaseUnitItems)(basket),
        prefer: 'return=minimal'
    };
    // Attempts to create the order
    try {
        const _a = yield ordersController.ordersCreate(collect), { body } = _a, httpResponse = __rest(_a, ["body"]);
        return {
            jsonResponse: JSON.parse(body.toString()),
            httpStatusCode: httpResponse.statusCode
        };
    }
    catch (error) {
        console.error(error);
        let errorMessage = "Error creating order with orderController: ";
        if (error instanceof paypal_server_sdk_1.ApiError) {
            errorMessage += error.message;
        }
        throw new Error(errorMessage);
    }
});
const captureOrder = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const collect = {
        id: orderId,
        prefer: "return=minimal"
    };
    try {
        const order = yield ordersController.ordersCapture(collect);
        const { body } = order, httpResponse = __rest(order, ["body"]);
        return {
            jsonResponse: JSON.parse(body.toString()),
            httpStatusCode: httpResponse.statusCode
        };
    }
    catch (error) {
        let errorMessage = 'Error capturing payment: ';
        console.error('Error thrown in paypalController on captureOrder', error);
        if (error instanceof Error) {
            errorMessage += error.message;
        }
        throw new Error(errorMessage);
    }
});
const getOrder = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order = yield ordersController.ordersGet({ id: orderId });
        return order.result;
    }
    catch (error) {
        const errorMessage = 'Error fetching the order information before verify';
        console.error(errorMessage, error);
        throw new Error(errorMessage);
    }
});
exports.default = { createOrder, captureOrder, getOrder };
