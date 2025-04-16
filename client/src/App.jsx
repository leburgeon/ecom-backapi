import { Routes, Route, Navigate } from "react-router-dom"
import ProductsPage from "./ProductsPage"
import LoginPage from "./LoginPage"
import Basket from './Basket'
import Navbar from './components/Navbar'
import NotificationBanner from "./components/NotificationBanner"
import { useSelector } from "react-redux"
import { v4 as uuidv4} from 'uuid'
import RegisterPage from "./RegisterPage"
import AccountPage from './AccountPage'
import SingleProductPage from "./components/SingleProductPage"
import Checkout from "./Checkout"
import OrderSuccessPage from './OrderSuccessPage'
import ProductUploadPage from './ProductUploadPage'
function App() {
  const notifications = useSelector(store => store.notifications)
  const user = useSelector(store => store.user)

  return (
    <>
      <Navbar/>
      {notifications.slice(0,3).map(notification => (<NotificationBanner key={uuidv4()} notification={notification}/>))}
      <Routes>
        <Route path='/' element={<ProductsPage/>}/>
        <Route path='/login' element={user? <Navigate to='/'/> : <LoginPage/>}/>
        <Route path='/basket' element={<Basket/>}/>
        <Route path='/register' element={user ? <Navigate to='/'/> : <RegisterPage/>}/>
        <Route path='/account' element={user ? <AccountPage/> : <Navigate to='/login'/>}/>
        <Route path='/product/:id' element={<SingleProductPage/>}/>
        <Route path='/checkout' element={<Checkout></Checkout>}/>
        <Route path='/success/:orderNumber' element={<OrderSuccessPage/>}/>
        <Route path="/product-upload" element={<ProductUploadPage/>}/>
      </Routes>
    </>
  )
}

export default App

{/* <Route element={<PrivateRoutes/>}>
  <Route path="/product-upload" element={<ProductUploadPage/>}/>
</Route> */}
