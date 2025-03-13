import { ProcessedBasket, TempOrderForValidating } from "../types";
import Product from "../models/Product";
import { PurchaseUnit } from "@paypal/paypal-server-sdk";
import { Item } from "@paypal/paypal-server-sdk";

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

export const mapProcessedBasketItemsToOrderItems = (basket: ProcessedBasket) => {
  return basket.items.map(item => ({
    product: item.product.id,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
  }))
}

export const validatePurchaseUnitsAgainstTempOrder = (purchaseUnit: PurchaseUnit, tempOrder: TempOrderForValidating) => {
  const {amount} = purchaseUnit
  if (!amount) {
    throw new Error('Purchase unit amount was not defined')
  }

  const { value, currencyCode } = amount
  if (Number.parseFloat(value) !== tempOrder.totalCost.value){
    throw new Error('Purchase unit and temp order had differing total amounts')
  }

  if (currencyCode !== tempOrder.totalCost.currencyCode){
    throw new Error('Currencies were not the same')
  }

  const {items} = purchaseUnit
  if (!items) {
    throw new Error('No items to validate in purchase units!')
  }

  if (items.length !== tempOrder.items.length){
    throw new Error('Item arrays had differing lengths')
  }

  // Hash map for each of the purchase unit items, with the sku(documentId as the key)
  const purchaseUnitItemsMap = new Map()
  // Sets the map values
  items.forEach((item: Item) => {
    const {unitAmount, sku, name, quantity} = item
    purchaseUnitItemsMap.set(sku, {
      name, quantity, price: Number.parseFloat(unitAmount.value)
    })
  })

  for (let item of tempOrder.items){
    const ofPurchaseUnit = purchaseUnitItemsMap.get(item.product.toString())
    if (! ofPurchaseUnit){
      throw new Error('Could not find a matching id for one of the items in temporder, arrays did not match')
    }
    if (ofPurchaseUnit.name !== item.name || ofPurchaseUnit.price !== item.price || ofPurchaseUnit.quantity !== item.quantity){
      throw new Error('Some information of the items did not match (name?/price?/quantity?/')
    }
  }
}