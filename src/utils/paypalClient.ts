import paypal from '@paypal/paypal-server-sdk'
import config from './config'

const client = new paypal.Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: config.PAYPALCLIENTID,
    oAuthClientSecret: config.PAYPALCLIENTSECRET
  },
  environment: paypal.Environment.Sandbox
})

export default client