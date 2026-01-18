import "../Style/Subscribe.css" ;  



export default function Subscribe() {
    return (
        <section>
            <div className="subscribe-box">
                <h3>Join the Celebration</h3>
                <p>Get Christmas updates straight to your inbox</p>
                <input type="email" placeholder="Enter your email" />
                <button>Subscribe</button>
            </div>
        </section>
    );
}