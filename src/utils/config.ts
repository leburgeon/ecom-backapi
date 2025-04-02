import { config } from "dotenv"
config()

const PORT = process.env.PORT

if (!PORT){
  throw new Error('PORT not defined')
}

const MONGODB_URL = process.env.MONGODB_URL

if (!MONGODB_URL || typeof MONGODB_URL !== 'string'){
  throw new Error('MONGODB_URL not defined or incorrect in process.env')
}

const SECRET = process.env.SECRET

if (!SECRET || typeof SECRET !== 'string'){
  throw new Error('environment SECRET not set!')
}

const PAYPALCLIENTID = process.env.PAYPALCLIENTID

if (!PAYPALCLIENTID || typeof PAYPALCLIENTID !== 'string'){
  throw new Error('Paypal clientID not defined')
}

const PAYPALCLIENTSECRET = process.env.PAYPALCLIENTSECRET

if (!PAYPALCLIENTSECRET || typeof PAYPALCLIENTSECRET !== 'string'){
  throw new Error('Paypal client secret not set')
}

const PAYPALURLENDPOINT = process.env.ENVIRONMENT === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'

const CLOUD_FRONT_IMAGE_BUCKET_URL = process.env.CLOUD_FRONT_IMAGE_BUCKET_URL

if (!CLOUD_FRONT_IMAGE_BUCKET_URL || typeof CLOUD_FRONT_IMAGE_BUCKET_URL !== 'string'){
  throw new Error('CLOUD_FRONT_IMAGE_BUCKET_URL not set')
}

const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME

if (!AWS_BUCKET_NAME || typeof AWS_BUCKET_NAME !== 'string'){
  throw new Error('AWS_BUCKET_NAME not set')
}

const UPSTASH_ENDPOINT = process.env.UPSTASH_ENDPOINT

if (!UPSTASH_ENDPOINT || typeof UPSTASH_ENDPOINT !== 'string'){
  throw new Error('UPSTASH_ENDPOINT redis endpoint not set')
}

const MAILGUN_PASSWORD = process.env.MAILGUN_PASSWORD

if (!MAILGUN_PASSWORD || typeof MAILGUN_PASSWORD !== 'string'){
  throw new Error('MAILGUN_PASSWORD not set')
}

export default {PORT, MONGODB_URL, SECRET, PAYPALCLIENTID, PAYPALCLIENTSECRET, PAYPALURLENDPOINT, CLOUD_FRONT_IMAGE_BUCKET_URL, AWS_BUCKET_NAME,
  UPSTASH_ENDPOINT,
  MAILGUN_PASSWORD
}



