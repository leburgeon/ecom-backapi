import mongoose from 'mongoose'

const descriptionSchema = new mongoose.Schema({
  content: {
    type: String,
    minLength: 10,
    required: true
  }
})

export default mongoose.model('Description', descriptionSchema)