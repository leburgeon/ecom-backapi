import mongoose from 'mongoose'
import { totalCostSchema } from './TempOrder'

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  status: {
    type: String,
    default: 'PENDING',
    enum: {
      values: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']
    }
  },
  payment: {
    method: String,
    status: String,
    transactionId: String
  },
  shippingAddress: {
    fullName: String,
    address: String,
    city: String,
    postalCode: String,
    country: String
  }
},{timestamps: true})

export default mongoose.model('Order', orderSchema)