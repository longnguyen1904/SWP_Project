
import "../Style/Hero.css" ; 
import Countdown from "./CountDown";

export default function Hero() {
    return (
        <section className="hero">
            <h2>
                SoftWare <span>Market</span>
            </h2>
            <p>You can try premium service here</p>
            <Countdown />
        </section>
    );
}