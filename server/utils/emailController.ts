import nodemailer from 'nodemailer'
import config from './config'
import { generateOrderConfirmationEmail } from './emailTemplates'

// transporter, which links to the mailgun account
const transporter = nodemailer.createTransport({
  host: 'smtp.mailgun.org',
  port: 587,
  secure: false,
  auth: {
    user: "postmaster@sandbox28a8cd5a9d2d4035ac2eff6cbf91df40.mailgun.org",
    pass: config.MAILGUN_PASSWORD
  }
})

// Method for sending a confirmation email
export const sendConfirmationEmail = (orderNumber: string, name: string, email: string) => {
  return transporter.sendMail({
    from: '"Order Confirmation" <test@ethereal.com>',
    to: email,
    subject: 'Order Confirmed!',
    html: generateOrderConfirmationEmail(orderNumber, name)
  })
}
