import { Typography, Paper, TextField, Box, styled, Button, Alert, Chip } from "@mui/material"; // Add Chip for category tiles
import { useControlledValue } from "./services/customHooks";
import { useState } from "react";
import productsService from "./services/productsService";

const ProductUploadPage = () => {
  const name = useControlledValue('a', 'Name');
  const price = useControlledValue(0, 'Price');
  const stock = useControlledValue(0, 'Stock');
  const description = useControlledValue('a description', 'Description');
  const seller = useControlledValue('a', 'Seller');
  const [firstImage, setFirstImage] = useState(null);
  const [error, setError] = useState(null);

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");

  const [galleryImages, setGalleryImages] = useState([]);

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory("");
    }
  };

  const handleDeleteCategory = (categoryToDelete) => {
    setCategories(categories.filter((category) => category !== categoryToDelete));
  };

  const handleFirstImageChange = (event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Only JPG and PNG files are allowed.");
        setFirstImage(null);
        return;
      }

      setError(""); // Clear any previous errors
      setFirstImage(selectedFile);
    }
  };

  const handleGalleryImagesChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const allowedTypes = ["image/jpeg", "image/png"];
    const validFiles = selectedFiles.filter(file => allowedTypes.includes(file.type));

    if (validFiles.length + galleryImages.length > 4) {
      setError("You can upload a maximum of 4 gallery images.");
      return;
    }

    setError(""); // Clear any previous errors
    setGalleryImages([...galleryImages, ...validFiles]);
  };

  const handleDeleteGalleryImage = (indexToDelete) => {
    setGalleryImages(galleryImages.filter((_, index) => index !== indexToDelete));
  };

  const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
  });

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!firstImage) {
      setError('Please upload an image');
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top
    } else if (categories.length === 0) {
      setError('Please add at least one category');
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top
    } else {
      const newProduct = {
        name: name.value,
        price: price.value,
        stock: stock.value,
        description: description.value,
        seller: seller.value,
        firstImage,
        categories,
        gallery: galleryImages
      };

      try {
        const response = await productsService.uploadProduct(newProduct);
        console.log(response);
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <Paper
      component='form'
      onSubmit={handleUpload}
      sx={{
        backgroundColor: '#ffffff',
        mt: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        maxWidth: '800px',
        padding: '30px',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        borderRadius: '10px',
      }}
    >
      {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
      <Typography sx={{ mt: '10px', fontWeight: 'bold' }} variant="h4" color="primary">
        Upload New Product
      </Typography>
      <Box sx={{ '& .MuiTextField-root': { m: 1, width: '100%' }, width: '100%' }}>
        <TextField 
          label={name.label} 
          type="text" 
          onChange={name.onChange} 
          value={name.value} 
          required 
          variant="outlined" 
        />
        <TextField 
          label={price.label} 
          type="number" 
          slotProps={{ input: { min: 0, step: "0.01" } }}
          onChange={price.onChange} 
          value={price.value} 
          required 
          variant="outlined" 
        />
        <TextField 
          type="number" 
          label={stock.label} 
          onChange={stock.onChange} 
          value={stock.value} 
          required 
          variant="outlined" 
        />
        <TextField 
          label={seller.label} 
          onChange={seller.onChange} 
          value={seller.value} 
          required 
          variant="outlined" 
        />
        <TextField 
          sx={{ minWidth: '100%' }} 
          multiline 
          label={description.label} 
          onChange={description.onChange} 
          value={description.value} 
          required 
          variant="outlined" 
        />
        <Button 
          variant='contained' 
          component='label' 
          sx={{ mt: 2, width: '100%' }}
        >
          {!firstImage ? 'Upload Main Image' : firstImage.name + ' - Uploaded'}
          <VisuallyHiddenInput
            type="file"
            onChange={handleFirstImageChange}
            multiple 
          />
        </Button>
      </Box>

      {/* Categories Input */}
      <Box sx={{ mt: 3, width: '100%' }}>
        <Typography variant="h6" gutterBottom color="secondary">
          Categories
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            label="New Category"
            variant="outlined"
            size="small"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={handleAddCategory}
          >
            Add
          </Button>
        </Box>
        <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              onDelete={() => handleDeleteCategory(category)}
              color="secondary"
              variant="outlined"
            />
          ))}
        </Box>
      </Box>

      {/* Gallery Images Input */}
      <Box sx={{ mt: 3, width: '100%' }}>
        <Typography variant="h6" gutterBottom color="secondary">
          Gallery Images
        </Typography>
        <Button 
          variant='contained' 
          component='label' 
          sx={{ width: '100%' }}
        >
          {galleryImages.length === 0 ? 'Upload Gallery Images (optional) - Max 4' : `${galleryImages.length} Images Uploaded`}
          <VisuallyHiddenInput
            type="file"
            onChange={handleGalleryImagesChange}
            multiple
          />
        </Button>
        <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
          {galleryImages.map((image, index) => (
            <Chip
              key={index}
              label={image.name}
              onDelete={() => handleDeleteGalleryImage(index)}
              color="secondary"
              variant="outlined"
            />
          ))}
        </Box>
      </Box>

      <Button 
        sx={{ mt: 3, width: '100%', padding: '10px', fontWeight: 'bold' }} 
        variant='contained' 
        color='primary' 
        type="submit"
      >
        Upload Product
      </Button>
    </Paper>
  );
};

export default ProductUploadPage;