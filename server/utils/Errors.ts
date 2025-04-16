//
// Defines an error containing information about which products stock invalidation threw the error
// Also includes information on the quantity of the stock that threw the error
export class StockError extends Error {
  public id: any
  public quantity?: any
  constructor(message: string, id: string, quantity?: number){
    super(message)
    this.name = 'StockError'
    this.id = id
    this.quantity = quantity
  }
}