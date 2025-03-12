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
const paypal_server_sdk_2 = require("@paypal/paypal-server-sdk");
const config_1 = __importDefault(require("./config"));
const client = new paypal_server_sdk_1.Client({
    clientCredentialsAuthCredentials: {
        oAuthClientId: config_1.default.PAYPALCLIENTID,
        oAuthClientSecret: config_1.default.PAYPALCLIENTSECRET
    },
    environment: paypal_server_sdk_1.Environment.Sandbox
});
const ordersController = new paypal_server_sdk_1.OrdersController(client);
//const _paymentController = new PaymentsController(client)
const createOrder = (cart) => __awaiter(void 0, void 0, void 0, function* () {
    const { totalCost, items } = cart;
    // Create the collect object
    const collect = {
        body: {
            intent: paypal_server_sdk_2.CheckoutPaymentIntent.Capture,
            purchaseUnits: [
                {
                    amount: {
                        currencyCode: 'GBP',
                        value: totalCost.toString()
                    }
                }
            ]
        },
        items: items.map(item => {
            return {
                name: item.product.name,
                unit_amount: {
                    currency_code: "GBP",
                    value: item.product.price
                },
                quantity: item.quantity
            };
        }),
        prefer: 'return=minimal'
    };
    // Attempts to create the order
    try {
        const _a = yield ordersController.ordersCreate(collect), { body } = _a, httpResponse = __rest(_a, ["body"]);
        return {
            jsonResponse: body,
            httpStatusCode: httpResponse.statusCode
        };
    }
    catch (error) {
        let errorMessage = "Error creating order with orderController: ";
        if (error instanceof paypal_server_sdk_1.ApiError) {
            errorMessage += error.message;
        }
        throw new Error(errorMessage);
    }
});
exports.default = { createOrder };
