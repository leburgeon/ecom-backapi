import nodemailer from 'nodemailer'
import { MailOptions } from 'nodemailer/lib/json-transport'
import config from './config'

const transporter = nodemailer.createTransport({
  host: 'smtp.mailgun.org',
  port: 587,
  secure: false,
  auth: {
    user: "postmaster@sandbox28a8cd5a9d2d4035ac2eff6cbf91df40.mailgun.org",
    pass: config.MAILGUN_PASSWORD
  }
})

const email:MailOptions  = {
  from: '"Test Name" <lwrgdsf@gdbb.com>',
  to: 'leburgeon1@gmail.com',
  subject: 'Hello!',
  text: 'Some text some \n tezt!',
  html: '<h1>some html<h1>'
}

export const sendTestEmail = () => {
  console.log('Sending test email!')
  return transporter.sendMail(email)
}
