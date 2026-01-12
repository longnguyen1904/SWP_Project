import "../Style/Events_Traditions.css" ;  

export default function Traditions() {
    return (
        <section>
            <h3>Holiday Traditions</h3>
            <div className="cards">
                {["Decorating the Tree", "Secret Gifts", "Hot Cocoa Nights", "Christmas Feast"].map(t => (
                    <div className="card" key={t}>
                        <h4>{t}</h4>
                        <p>Timeless Christmas tradition</p>
                    </div>
                ))}
            </div>
        </section>
    );
}