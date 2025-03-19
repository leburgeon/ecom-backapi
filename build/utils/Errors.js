"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockError = void 0;
class StockError extends Error {
    constructor(message, id, quantity) {
        super(message);
        this.name = 'StockError';
        this.id = id;
        this.quantity = quantity;
    }
}
exports.StockError = StockError;
