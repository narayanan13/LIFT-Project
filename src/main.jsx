import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter as Router } from 'react-router-dom'
import { StytchProvider, initStytch } from '@stytch/stytch-react'

const stytch = initStytch("public-token-test-6fc66aca-652d-4009-8d3c-671e89fe4c2c")

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StytchProvider stytch={stytch}>
      <Router>
        <App />
      </Router>
    </StytchProvider>
  </StrictMode>,
)
