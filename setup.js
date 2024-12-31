import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'

const dburl = process.env.MONGODB_URL

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    quantity: Number,
    reserved: {
      type: Number,
      default: 0
    }
  },
  description: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Description'
  }
})

const Product = mongoose.model('Product', productSchema)

const sampleProducts = [
  {
    name: 'Product 1',
    category: 'Category A',
    price: 29.99,
    stock: {
      quantity: 100,
      reserved: 10
    },
    description: new mongoose.Types.ObjectId()
  },
  {
    name: 'Product 2',
    category: 'Category B',
    price: 49.99,
    stock: {
      quantity: 50,
      reserved: 5
    },
    description: new mongoose.Types.ObjectId()
  },
  {
    name: 'Product 3',
    category: 'Category A',
    price: 19.99,
    stock: {
      quantity: 200,
      reserved: 20
    },
    description: new mongoose.Types.ObjectId()
  },
  {
    name: 'Product 4',
    category: 'Category C',
    price: 99.99,
    stock: {
      quantity: 0,
      reserved: 0
    },
    description: new mongoose.Types.ObjectId()
  },
  {
    name: 'Product 5',
    category: 'Category B',
    price: 59.99,
    stock: {
      quantity: 80,
      reserved: 8
    },
    description: new mongoose.Types.ObjectId()
  },
  {
    name: 'Product 6',
    category: 'Category C',
    price: 39.99,
    stock: {
      quantity: 0,
      reserved: 12
    },
    description: new mongoose.Types.ObjectId()
  },
  {
    name: 'Product 7',
    category: 'Category A',
    price: 24.99,
    stock: {
      quantity: 150,
      reserved: 15
    },
    description: new mongoose.Types.ObjectId()
  },
  {
    name: 'Product 8',
    category: 'Category B',
    price: 79.99,
    stock: {
      quantity: 60,
      reserved: 6
    },
    description: new mongoose.Types.ObjectId()
  },
  {
    name: 'Product 9',
    category: 'Category C',
    price: 89.99,
    stock: {
      quantity: 40,
      reserved: 4
    },
    description: new mongoose.Types.ObjectId()
  },
  {
    name: 'Product 10',
    category: 'Category A',
    price: 34.99,
    stock: {
      quantity: 90,
      reserved: 9
    },
    description: new mongoose.Types.ObjectId()
  }
]

try {
  console.log('connecting...')
  await mongoose.connect(dburl)
  console.log('connected')

  const asDocs = sampleProducts.map(obj => new Product(obj))

  await Product.insertMany(asDocs)
  
} catch (error){
  console.error(error)
}

