import { useSelector, useDispatch } from "react-redux"
import { goToPage, changePageLimit } from "../reducers/productsReducer"
import { Box, Button, Select, MenuItem, Typography, FormControl, InputLabel } from '@mui/material'
import { ArrowBack, ArrowForward } from '@mui/icons-material'

const PaginationController = () => {
  const dispatch = useDispatch()
  const { page, limit, pageCount } = useSelector(store => store.products.pagination)

  const handlePageChange = (newPage) => {
    dispatch(goToPage(newPage))
  }

  const handleLimitChange = (event) => {
    dispatch(changePageLimit(event.target.value))
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
      <Button 
        onClick={() => handlePageChange(page - 1)} 
        disabled={page <= 1}
      >
        <ArrowBack />
      </Button>
      <Typography mx={2}>
        Page {page} / {pageCount}
      </Typography>
      <Button 
        onClick={() => handlePageChange(page + 1)} 
        disabled={page >= pageCount}
      >
        <ArrowForward />
      </Button>
      <FormControl variant="outlined" ml={2}>
        <InputLabel>Products per page</InputLabel>
        <Select
          value={limit}
          onChange={handleLimitChange}
          label="Products per page"
        >
          <MenuItem value={5}>5</MenuItem>
          <MenuItem value={20}>20</MenuItem>
          <MenuItem value={50}>50</MenuItem>
          <MenuItem value={100}>100</MenuItem>
        </Select>
      </FormControl>
    </Box>
  )
}

export default PaginationController