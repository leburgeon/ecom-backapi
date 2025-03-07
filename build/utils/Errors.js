"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockError = void 0;
class StockError extends Error {
    constructor(message, id) {
        super(message);
        this.name = 'StockError';
        this.id = id;
    }
}
exports.StockError = StockError;
