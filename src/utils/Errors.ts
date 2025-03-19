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