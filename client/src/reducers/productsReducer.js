import { createSlice } from '@reduxjs/toolkit'
import productsService from '../services/productsService'
import { notify } from './notificationReducer'

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    pagedProducts: [],
    searched: false,
    pagination: {
      page: 1,
      limit: 5,
      productCount: 0,
      pageCount: 0
    },
  },
  reducers: {
    setProducts(state, action){
      state.pagedProducts = action.payload
    },
    clearProducts(state, _action){
      state.pagedProducts = []
    },
    setSearched(state, action){
      state.searched = true
    },
    setProductCount(state, action){
      state.pagination.productCount = action.payload
      state.pagination.pageCount = Math.ceil(action.payload/state.pagination.limit)
    },
    setPage(state, action){
      state.pagination.page = action.payload
    },
    setPageLimit(state, action){
      state.pagination.limit = action.payload
      state.pagination.pageCount = Math.ceil(state.pagination.productCount / action.payload)
    },
    resetAll(_state,_action){
      return {
        pagedProducts: [],
        searched: false,
        pagination: {
          page: 1,
          limit: 5,
          productCount: 0,
          pageCount: 0
        },
      }
    }
  }
})

export default productsSlice.reducer

export const { setProducts, clearProducts, setSearched, setProductCount, setPage, setPageLimit, resetAll } = productsSlice.actions

export const searchWith = (filters) => {
  return async (dispatch, getState) => {
    try {
      const { products: { pagination }} = getState()
      // TODO: cleanup this mess
      const data = await productsService.retrieveProducts({...filters, page: 1, limit: pagination.limit})
      dispatch(setProducts(data.products))
      dispatch(setSearched())
      dispatch(setProductCount(data.productsCount))
      dispatch(setPage(1))
    } catch (error) {
      console.error(error)
      dispatch(notify({
        message: `Error retrieving results ${error.name}, please try again`,
        severity: "error"
      }))
    }
  }
}

export const goToPage = (newPage) => {
  return async (dispatch, getState) => {
    const { products: { pagination }, filters } = getState()
    try {
      const data = await productsService.getPageOf({...filters, page: newPage, limit: pagination.limit})
      dispatch(setProducts(data))
      dispatch(setPage(newPage))
      window.scrollTo(0,0)
    } catch (error) {
      console.error(error)
      dispatch(notify({
        message: `Error retrieving results ${error.name}, please try again`,
        severity: "error"
      }))
    }
  }
}

// Action creator for changing the view limit for the products on the page. 
// Resets (this is very inefficient, i want to focus on the bankend though) the products by making a new search
// Resets the page to page 1
// The reason why i dont want to calculate the amount of new products to call, is that if the user is not on the first page, then subsequent next page calls become complicated
// This frontend complexity is not what i wish to focus on with this applicaiton
export const changePageLimit = (newLimit) => {
  return async (dispatch, getState) => {
    const { filters } = getState()
    try {
      // In reality, this is bad practice, changing the page limit before confirmation that the new products have been retrieved
      dispatch(setPageLimit(newLimit))
      dispatch(searchWith({...filters}))
    } catch (error){
      console.error(error)
      dispatch(notify({
        message: `Error retrieving results ${error.name}, please try again`,
        severity: "error"
      }))
    }
  }
}