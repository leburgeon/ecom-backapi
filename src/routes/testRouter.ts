import express from "express";
import multer from 'multer'

const testRouter = express.Router()

const imageUploadPath = "C:/Users/lewis/repos/ecom-backapi/images"

const upload = multer({dest: imageUploadPath})

testRouter.post('/image', upload.single('image') ,(req, res) => {
  console.log('#################################')
  console.log(req.body)
  console.log(req.file)
  res.status(200).json({data: 'ok'})
})

export default testRouter