import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter as Router } from 'react-router-dom'
import { StytchProvider, initStytch } from '@stytch/stytch-react'

const stytch = initStytch("public-token-test-d3a135eb-1a39-44b9-a368-4e5325dd0609")

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StytchProvider stytch={stytch}>
      <Router>
        <App />
      </Router>
    </StytchProvider>
  </StrictMode>,
)
