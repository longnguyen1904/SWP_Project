import "../Style/Events_Traditions.css" ;  

export default function Events() {
    return (
        <section>
            <h3>Holiday Events</h3>
            <div className="cards">
                {["Carol Night", "Cookie Exchange", "Candlelight Vigil"].map(e => (
                    <div className="card" key={e}>
                        <h4>{e}</h4>
                        <p>Special Christmas celebration event</p>
                    </div>
                ))}
            </div>
        </section>
    );
}