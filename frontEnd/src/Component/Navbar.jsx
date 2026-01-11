import { useRef } from "react";
import logo from "../public/logo_no_bg.png" ;  
import LogIn  from "./LogIn";





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
                <li>Home</li>
                <li>About</li>
                <li>Events</li>
                <li>Traditions</li>
            </ul>
            <button className="Register" onClick={handleClick}>Login / SignUp</button>       
        </nav>
        </>
    );
}  