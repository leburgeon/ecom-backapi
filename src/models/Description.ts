import mongoose from 'mongoose'

// Model for the description assoicated with a product
const descriptionSchema = new mongoose.Schema({
  content: {
    type: String,
    minLength: 10,
    required: true
  }
})

export default mongoose.model('Description', descriptionSchema)