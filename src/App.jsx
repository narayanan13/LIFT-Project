import { Routes, Route, useNavigate } from "react-router-dom"
import Navigation from "./components/Navigation"
import Home from "./views/Home"
import Login from "./views/Login"
import Authenticate from "./views/Authenticate"
import Account from "./views/Account"

function App() {

  return (
    <>
      <Navigation />

      <Routes>
        <Route index path="/" element={<Home />} />
        <Route index path="/login" element={<Login />} />
        <Route index path="/account" element={<Account />} />
        <Route index path="/authenticate" element={<Authenticate />} />
        <Route index path="*" element={<p>404 😞 Page Not Found!</p>} />
      </Routes>
    </>
  )
}

export default App
