import "../Style/Footer.css"

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="row">
                    <div className="col-md-4 footer-col">
                        <div className="footer_contact">
                            <h4>Contact Us</h4>
                            <div className="contact_link_box">
                                <a href="#">
                                    <i className="fa fa-map-marker" aria-hidden="true"></i>
                                    <span> Location</span>
                                </a>
                                <a href="#">
                                    <i className="fa fa-phone" aria-hidden="true"></i>
                                    <span> Call +01 1234567890</span>
                                </a>
                                <a href="#">
                                    <i className="fa fa-envelope" aria-hidden="true"></i>
                                    <span> demo@gmail.com</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4 footer-col">
                        <div className="footer_detail">
                            <a href="#" className="footer-logo">Feane</a>
                            <p>
                                Necessary, making this the first true generator on the Internet.
                            </p>
                            <div className="footer_social">
                                <a href="#"><i className="fa fa-facebook"></i></a>
                                <a href="#"><i className="fa fa-twitter"></i></a>
                                <a href="#"><i className="fa fa-linkedin"></i></a>
                                <a href="#"><i className="fa fa-instagram"></i></a>
                                <a href="#"><i className="fa fa-pinterest"></i></a>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 footer-col">
                        <h4>Opening Hours</h4>
                        <p>Everyday</p>
                        <p>10.00 Am - 10.00 Pm</p>
                    </div>
                </div>

                <div className="footer-info">
                    <p>
                        &copy;  All Rights Reserved By{" "}
                        <a href="https://html.design/">Free Html Templates</a>
                    </p>
                </div>
            </div>
        </footer>
    );
}