import mongoose from "mongoose"

const tempOrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
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
  totalCost:Number,
  paymentTransactionId: String
}, {timestamps: true})

export default mongoose.model('TempOrder', tempOrderSchema)