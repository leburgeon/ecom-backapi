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

export default {PORT, MONGODB_URL, SECRET, PAYPALCLIENTID, PAYPALCLIENTSECRET, PAYPALURLENDPOINT}