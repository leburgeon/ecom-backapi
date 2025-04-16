import ProductCard from './components/ProductCard'
import { Grid2 as Grid, Container, Typography, Box } from '@mui/material'
// import { products } from '../data'
import ProductSearchBar from './components/ProductsSearchBar'
import { useDispatch, useSelector } from 'react-redux'
import PaginationController from './components/PaginationController'
import { updateFilter } from './reducers/filtersReducer'
import { searchWith } from './reducers/productsReducer'

const ProductsPage = () => {

  const { searched, pagedProducts } = useSelector(store => store.products)
  const filters = useSelector(store => store.filters)
  const dispatch = useDispatch()


  const renderProducts = () => {
    return (
      <>
        <Grid container spacing={2}>
          {pagedProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </Grid>
        <PaginationController />
      </>
      
    )
  }

  const renderNoneFound = () => {
    return (
      <h3>No products found... try searching for somthing or remove some filters!</h3>
    )
  }

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
  ]

  const handleSearchByCategory = (category) => {
    const newFilter = {...filters, category}
    // Set the category in the filter
    dispatch(updateFilter(newFilter))
    // Complete the search with the new filter object
    dispatch(searchWith(newFilter))
  }

  const renderSearchSomthing = () => {
    return (
      <Container
        sx={{
          display: "flex",
          maxWidth: "80%",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3, // Increased spacing for better layout
          padding: 4, // Added padding for a cleaner look
          backgroundColor: "#f9f9f9", // Light background for contrast
          borderRadius: 2, // Rounded corners for a modern look
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "bold", marginBottom: 2 }}>
          Search by Category
        </Typography>
        <Container
          sx={{
            display: "grid",
            width: "100%",
            gap: 2,
            justifyContent: "center",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", // Adjusted for better responsiveness
          }}
        >
          {categoryOptions.map((categoryOption) => {
            return (
              <Typography
                key={categoryOption.value}
                sx={{
                  textAlign: "center",
                  textDecoration: "none",
                  fontWeight: "500",
                  color: "#333",
                  cursor: "pointer",
                  "&:hover": {
                    color: "#1976d2", // Professional blue hover color
                    textDecoration: "underline",
                  },
                }}
                onClick={() => {
                  handleSearchByCategory(categoryOption.value);
                }}
              >
                {categoryOption.label}
              </Typography>
            );
          })}
        </Container>
      </Container>
    );
  }

  return (
    <>
      <ProductSearchBar/>
      {searched 
        ? pagedProducts.length > 0 
          ? renderProducts()
          : renderNoneFound()
        : renderSearchSomthing()}
      
    </>
    
  )
}

export default ProductsPage