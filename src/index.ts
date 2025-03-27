import app from './app'
import config from './utils/config'
import mongoose from 'mongoose'
//import { tempOrderCleanupTask } from './utils/backgroundJobs'

const port = config.PORT || 3000

const startServer = async () => {
  try {
    console.log('Connecting to mongodb...')
    await mongoose.connect(config.MONGODB_URL)
    console.log('Connected')
  } catch (error: unknown) {
    let errorMessage = 'Error connecting to mongoDB: '
    if (error instanceof Error){
      errorMessage += error.message
    }
    console.error(error)
  }

  // console.log('Starting jobs')
  // tempOrderCleanupTask.start()
  
  app.listen(port, () => {
    console.log('App listening on port ' + port)
  })
}

startServer()

