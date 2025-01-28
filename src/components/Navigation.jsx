import { NavLink } from "react-router-dom";

export default () => {
    return (
        <nav>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/account">Account</NavLink>
            <button>Logout</button>
        </nav>
    )
}