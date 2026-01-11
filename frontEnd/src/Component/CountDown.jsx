import { useEffect, useState } from "react";


export default function Countdown() {
    const target = new Date("2026-12-25T00:00:00");
    const [time, setTime] = useState({});


    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const diff = target - now;


            setTime({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / (1000 * 60)) % 60),
                seconds: Math.floor((diff / 1000) % 60)
            });
        }, 1000);


        return () => clearInterval(timer);
    }, []);


    return (
        <div className="countdown">
            {Object.entries(time).map(([k, v]) => (
                <div className="time-box" key={k}>
                    <p>{v}</p>
                    <span>{k}</span>
                </div>
            ))}
        </div>
    );
}