import mongoose from "mongoose"

export const totalCostSchema = new mongoose.Schema({
  currencyCode: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true
  }
}, { _id: false });

const tempOrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      name: {
        type: String,
        required: true
      }
    }
  ],
  totalCost: {
    type: totalCostSchema,
    required: true
  },
  paymentTransactionId: String
}, {timestamps: true})

export default mongoose.model('TempOrder', tempOrderSchema)