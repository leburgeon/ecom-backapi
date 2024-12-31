import mongoose from 'mongoose'

const descriptionSchema = new mongoose.Schema({
  content: {
    type: String,
    minLength: 10,
    required: true
  },
  product: {
    type: mongoose.Types.ObjectId,
    required: true
  }
})

descriptionSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = document._id
    delete returnedObject.product
    delete returnedObject._id
    delete returnedObject.__v
  }
})

export default mongoose.model('Description', descriptionSchema)