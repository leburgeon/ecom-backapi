import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter as Router } from 'react-router-dom'
import { Container } from '@mui/material'
import store from './store.js'
import { Provider } from 'react-redux'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import paypalService from './services/paypalService.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Container>
        <Provider store={store}>
          <PayPalScriptProvider options={paypalService.paypalInitialOptions}>
            <App/>
          </PayPalScriptProvider>
        </Provider>
      </Container>
    </Router>
  </StrictMode>
)
