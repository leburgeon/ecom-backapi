"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const paypal_server_sdk_1 = __importDefault(require("@paypal/paypal-server-sdk"));
const config_1 = __importDefault(require("./config"));
const client = new paypal_server_sdk_1.default.Client({
    clientCredentialsAuthCredentials: {
        oAuthClientId: config_1.default.PAYPALCLIENTID,
        oAuthClientSecret: config_1.default.PAYPALCLIENTSECRET
    },
    environment: paypal_server_sdk_1.default.Environment.Sandbox
});
exports.default = client;
