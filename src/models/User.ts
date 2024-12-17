import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    minLength: 5,
    required: true,
    unique: true
  },
  name:{
    type: String,
    required: true,
  },
  orders:{
    type:[mongoose.Schema.Types.ObjectId],
    default: []
  },
  passwordHash: {
    type: String,
    required: true
  }
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = document._id.toString(),
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  }
})

const User = mongoose.model('User', userSchema)

export default User