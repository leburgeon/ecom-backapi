import app from './app'
import config from './utils/config'
import mongoose from 'mongoose'

const port = config.PORT || 3000

try {
  await mongoose.connect(config.MONGODB_URL)
}

app.listen(port, () => {
  console.log('App listening on port ' + port)
})