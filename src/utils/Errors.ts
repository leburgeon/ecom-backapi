export class StockError extends Error {
  public id: any
  constructor(message: string, id: string){
    super(message)
    this.name = 'StockError'
    this.id = id
  }
}