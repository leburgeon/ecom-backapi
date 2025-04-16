import { Button } from "@mui/material"
import { useState } from "react"
import axios from "axios"

const ImageUpload = () => {
  const [image, setImage] = useState(null)

  const handleUpload = async () => {
    try {
      const response = await axios.post('/api/test/image', image)
      console.log(response.data)
    } catch (error) {
      console.error(error)
      console.log('error uploading image')
    }
  }

  const handleFileChange = (event) => {
    const formData = new FormData()
    formData.append('image', event.target.files[0], event.target.files[0].name)
    setImage(formData)
  }

  return (<>
    <h1>Image upload</h1>
    <input type="file" onChange={handleFileChange}/>
    <Button variant="contained" onClick={handleUpload}>Upload</Button>
  </>)

}

export default ImageUpload