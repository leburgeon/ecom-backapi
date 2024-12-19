import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  inStock: {
    type: Boolean,
    required: true,
    default: false
  },
  description: {
    type: mongoose.Types.ObjectId,
    required: true
  }
})

productSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = document._id.toString()
    returnedObject.description = returnedObject.description.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

export default mongoose.model('Product', productSchema)