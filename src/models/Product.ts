import mongoose from 'mongoose'

const stockSchema = new mongoose.Schema({
  quantity: {
    type: Number,
    default: 0
  },
  reserved: {
    type: Number,
    default: 0
  }
})

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
  stock: {
    type: stockSchema,
    required: true
  },
  description: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Description'
  }
})

productSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = document._id.toString()
    delete returnedObject._id
    delete returnedObject.__v

    // If the product documents description field has not been populated, delete the field
    if (!document.populated('description')){
      delete returnedObject.description
    } 
  }
})

export default mongoose.model('Product', productSchema)