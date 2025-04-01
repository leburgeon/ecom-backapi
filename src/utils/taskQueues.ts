import { Queue, Worker } from "bullmq"
import Redis from 'ioredis'
import config from "./config"

// Creates a new redis connection for bullmq to connect to
const connection = new Redis(config.UPSTASH_ENDPOINT, { maxRetriesPerRequest: null })

// Creates a new queue for testing
const testQueue = new Queue('Test', {connection})

// Function for adding a job to the queue
export const addTestJob = async () => {
  console.log('job added to the queue')
  await testQueue.add('a test job added to the queue', {data: 'foo'})
}

// Worker for handling the jobs asynchronously
// test worker logs the job 5 seconds after added
export const testWorker = new Worker('Test', async (job) => {
  console.log('worker recieved job, and started async operation')
  setTimeout(() => {
    console.log('#################################')
    console.log(job.name)
    console.log('#################################')
    console.log(job.data)
  }, 5000);
}, { connection, autorun: false })


