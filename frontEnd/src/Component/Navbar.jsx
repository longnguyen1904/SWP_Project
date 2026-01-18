
import { useRef } from "react";
import {Link} from "react-router-dom"
import logo from "../public/logo_no_bg.png" ;  
import LogIn  from "./LogIn";
import "../Style/Navbar.css" ; 


export default function Navbar() {
    const dialog = useRef() ;  
    function handleClick(){
        dialog.current.showModal() ;   
    }
    return (
        <>
        <nav className="navbar">
            <LogIn ref={dialog}></LogIn>
            <h1 className="logo"><img src={logo}></img></h1>
            <ul>
                <li><Link to="/" id="router-link">Home</Link></li>
                <li><Link to="../Page/About" id="router-link">About</Link></li>
                <li><Link to="../Page/Event" id="router-link">Events</Link></li>
                <li><Link to="../Page/Tradition" id="router-link">Traditons</Link></li>
            </ul>
            <button className="Register" onClick={handleClick}>Login / SignUp</button>       
        </nav>
        </>
    );
}  