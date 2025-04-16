import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { searchWith } from '../reducers/productsReducer';
import { updateFilter } from '../reducers/filtersReducer'
import {
  Box,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Autocomplete,
  Typography,
  Grid2
} from '@mui/material';

const ProductSearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState(null); // Changed to single category
  const [priceRange, setPriceRange] = useState([null, null]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const dispatch = useDispatch()

  // Example category options
  const categoryOptions = [
    { label: 'Electronics', value: 'electronics' },
    { label: 'Clothing', value: 'clothing' },
    { label: 'Books', value: 'books' },
    { label: 'Home', value: 'home' },
    { label: 'Audio', value: 'audio' },
    { label: 'Gaming', value: 'gaming' },
    { label: 'Home & Kitchen', value: 'home & kitchen' },
    { label: 'Home Automation', value: 'home automation' },
    { label: 'Computers', value: 'computers' },
    { label: 'Outdoor', value: 'outdoor' },
    { label: 'Wearables', value: 'wearables' }
  ];

  const handleSearch = () => {
    const filters = {
      query: searchQuery,
      category: category ? category.value : null, // Changed to single category
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      inStockOnly,
    }
    dispatch(searchWith(filters))
    dispatch(updateFilter(filters))
  };

  return (
    <Box
      sx={{
        width: '100%',
        margin: 'auto',
        padding: 2,
      }}
    >
      <Grid2 container spacing={2} alignItems="center">
        {/* Category Autocomplete */}
        <Grid2 xs={12} md={6} sx={{ minWidth: 200 }}>
          <Autocomplete
            fullWidth
            options={categoryOptions}
            getOptionLabel={(option) => option.label}
            value={category}
            onChange={(event, newValue) => setCategory(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                variant="outlined"
                label="Category"
                placeholder="Select"
              />
            )}
          />
        </Grid2>

        {/* Price Range Inputs */}
        <Grid2 xs={12} md={4}>
          <Box display="flex" alignItems="center">
            <TextField
              label="Min Price"
              type="number"
              value={priceRange[0] !== null ? priceRange[0] : ''}
              onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
              variant="outlined"
              sx={{ marginRight: 2 }}
              InputProps={{
                startAdornment: <Typography sx={{ marginRight: 1 }}>£</Typography>,
              }}
            />
            <TextField
              label="Max Price"
              type="number"
              value={priceRange[1] !== null ? priceRange[1] : ''}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              variant="outlined"
              InputProps={{
                startAdornment: <Typography sx={{ marginRight: 1 }}>£</Typography>,
              }}
            />
          </Box>
        </Grid2>

        {/* In-Stock Only Checkbox */}
        <Grid2 xs={12} md={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
            }
            label="In Stock"
          />
        </Grid2>

        {/* Search Query - last filter before the Search button */}
        <Grid2 xs={12} md={8}>
          <TextField
            fullWidth
            label="Search"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Grid2>

        {/* Search Button */}
        <Grid2 xs={12} md={4}>
          <Button fullWidth variant="contained" color="primary" onClick={handleSearch}>
            Search
          </Button>
        </Grid2>
      </Grid2>
    </Box>
  );
};

export default ProductSearchBar;
