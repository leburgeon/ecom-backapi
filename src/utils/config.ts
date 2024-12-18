import { config } from "dotenv"
config()

const PORT = process.env.PORT

const MONGODB_URL = process.env.MONGODB_URL

if (!MONGODB_URL || typeof MONGODB_URL !== 'string'){
  throw new Error('MONGODB_URL not defined or incorrect in process.env')
}

if (!PORT){
  throw new Error('PORT not defined')
}

export default {PORT, MONGODB_URL}