import { createSlice } from "@reduxjs/toolkit";

const basketSlice = createSlice({
  name: 'basket',
  initialState: {
    items: [],
    count: 0
  },
  reducers: {
    setBasketCount (state, action){
      state.count = action.payload
    },
    setBasketItems (state, action){
      state.items = action.payload
    },
    resetBasket(_state, _action){
      return {
        items: [],
        count: 0
      }
    },
    // Increments the quantity of the item with the matching id by the amount specified
    // Then filters for any items with quantities less than 1
    incrementQuantityOfItem(state, action){
      state.items = state.items.map(item => {
        if (item.product.id === action.payload.id){
          return {product: item.product, quantity: item.quantity + action.payload.quantity}
        }
        return item
      }).filter(item => item.quantity > 0)
    },
    removeItem(state, action){
      state.items = state.items.filter(item => item.product.id !== action.payload.id)
    },
    // Updates the stock of the values to the latest known value
    // Action payload is an array of objects with id and quantity
    updateStockOnBasketItems(state, action){
      // maps the ids to the quantities
      const quantities = new Map()
      for (let obj of action.payload){
        quantities.set(obj.id, obj.quantity)
      }
      // Sets the items array to the mapped array with updated stock values
      state.items = state.items.map(item => {
        if (!quantities.has(item.product.id)){
          return item
        } else {
          return {quantity: item.quantity,
            product: {
              ...item.product,
              stock: quantities.get(item.product.id)
            }
          }
        }
      })
    }
  }
})

export const {setBasketCount, setBasketItems, resetBasket, incrementQuantityOfItem, removeItem, updateStockOnBasketItems} = basketSlice.actions

export default basketSlice.reducer