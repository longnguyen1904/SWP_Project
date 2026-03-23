import { Link } from "react-router-dom";
import "../Style/Events_Traditions.css";

export default function Events() {
    return (
        <section className="tech-section">
            <h3 className="tech-title">Upcoming Dev Events</h3>
            <div className="tech-cards">
                <div className="tech-card card-cyan">
                    <h4>TALLT Hackathon 2026</h4>
                    <p>Build the future of decentralized Dapps. Compete with top developers and win prizes up to $10,000.</p>
                </div>
                <div className="tech-card card-orange">
                    <h4>Cyber Security Mastery</h4>
                    <p>Learn advanced anti-crack, decompilation prevention, and how to master the LicenseGuard SDK.</p>
                </div>
                <div className="tech-card card-purple">
                    <h4>Vendor Onboarding</h4>
                    <p>Live webinar on how to setup your digital store, optimize app sales, and integrate DRM securely.</p>
                </div>
            </div>
            <div className="tech-action">
                <Link to="/Page/Event" className="tech-action-btn">View Full Events Gallery</Link>
            </div>
        </section>
    );
}