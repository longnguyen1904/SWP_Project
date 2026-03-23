import "../Style/Events_Traditions.css";

export default function Traditions() {
    return (
        <section className="tech-section bg-alt">
            <h3 className="tech-title">Why Choose TALLT Market?</h3>
            <div className="tech-cards">
                <div className="tech-card card-green">
                    <h4>🔒 Ironclad Security</h4>
                    <p>Military-grade LicenseGuard SDK protects your software from piracy, automated cracking, and unauthorized distribution.</p>
                </div>
                <div className="tech-card card-blue">
                    <h4>⚡ Global Infrastructure</h4>
                    <p>Lightning fast global CDNs ensure your Dapps and updates reach customers dynamically with absolute zero latency.</p>
                </div>
                <div className="tech-card card-pink">
                    <h4>💰 Fair Revenue Split</h4>
                    <p>Industry-leading revenue sharing model. You keep 95% of what you earn transparently on every digital sale.</p>
                </div>
                <div className="tech-card card-yellow">
                    <h4>🤝 24/7 Dev Support</h4>
                    <p>Dedicated technical support team ready to assist you in SDK integration, cloud deployment, and system scaling.</p>
                </div>
            </div>
        </section>
    );
}