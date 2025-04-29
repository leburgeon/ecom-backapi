import { Queue, Worker } from "bullmq"
import Redis from 'ioredis'
import config from "./config"
import { sendConfirmationEmail } from "./emailController"

// Creates a new redis connection for bullmq to connect to
const connection = new Redis(config.UPSTASH_ENDPOINT)

// Creates a new queue for email tasks
const emailQueue = new Queue('Email', {connection})

// Function for enqueing a conformation email job
export const enqueueConfirmationEmail = async (orderNumber: string, name: string, email: string) => {
  // Adds the job to the queue with the name: 'Order Confirmation Email'
  await emailQueue.add('Order Confirmation Email', {orderNumber, name, email})
}
// Worker for handling 'Email' jobs
const emailWorker = new Worker('Email', async (job) => {
  console.log('email worker recieved job, and started async operation')
  if (job.name === 'Order Confirmation Email'){
    const {orderNumber, name, email} = job.data
    try {
      const info = await sendConfirmationEmail(orderNumber, name, email)
      console.log('Send confirmation email!', info.messageId)
    } catch ( error ){
      console.error('Error sending confirmation email!', error)
      job.retry()
    }
  }
}, { connection, autorun: false })


// Function for starting the workers
export const startTaskQueueWorkers = () => {
  emailWorker.run()
}


