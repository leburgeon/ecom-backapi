import { ProcessedBasket } from "../types";
import Product from "../models/Product";

export const processBasket = async (basket: {id: string, quantity: number}[]): Promise<ProcessedBasket> => {
  
  // If the basket is empty, returns error
  if (basket.length === 0){
    throw new Error('Basket was empty')
  }
  
  // Joins any basket items with the same id using a map
  // This prevents error where same document updated in same transaction
  const basketItems: Map<string, number> = new Map()
  for (const item of basket){
    const exists = basketItems.get(item.id)
    if (exists){
      basketItems.set(item.id, exists + item.quantity)
    } else {
      basketItems.set(item.id, item.quantity)
    }
  }

  // Finds all the documents associated with the ids in the basket
  const uniqueIds = Array.from(basketItems.keys())
  const productDocsForCalculatingTotal = await Product.find({_id: {$in: uniqueIds}})

  if (productDocsForCalculatingTotal.length !== uniqueIds.length){
    throw new Error('Some product ids invalid')
  } 

  // For storing array of items in the basket that are in the created order alongside a processed total
  const processedBasket: ProcessedBasket = {
    items: new Array(),
    totalCost: 0
  }

  // If all valid ids and products found, processes the basket using the product docs, appending the total
  // Throws an error if any of the products have less stock than the required quantity
  productDocsForCalculatingTotal.forEach(productDoc => {
    const idString = productDoc._id.toString()
    const quantity = basketItems.get(idString) || 0
    if (quantity > productDoc.stock){
      throw new Error('Not enough stock')
    } else {
      const price = productDoc.price
      processedBasket.totalCost += price * quantity
      processedBasket.items.push({
        product: {
          id: idString,
          name: productDoc.name,
          price: price
        },
        quantity
      })
    }
  })

  return processedBasket
}