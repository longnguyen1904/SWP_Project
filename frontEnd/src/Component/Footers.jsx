import "../Style/Footer.css"

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="row">
                    <div className="col-md-4 footer-col">
                        <div className="footer_contact">
                            <h4>Liên Hệ Chúng Tôi</h4>
                            <div className="contact_link_box">
                                <a href="#">
                                    <i className="fa fa-map-marker" aria-hidden="true"></i>
                                    <span> Đại học FPT (FPT University)</span>
                                </a>
                                <a href="#">
                                    <i className="fa fa-phone" aria-hidden="true"></i>
                                    <span> Zalo: +84 123 456 789</span>
                                </a>
                                <a href="#">
                                    <i className="fa fa-envelope" aria-hidden="true"></i>
                                    <span> longnguyen1904@gmail.com</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4 footer-col">
                        <div className="footer_detail">
                            <a href="#" className="footer-logo">TALLT Market</a>
                            <p>
                                Nền tảng Sàn Giao Dịch Phần Mềm tiên phong (Software Marketplace). 
                                Nơi chia sẻ mã nguồn, Dapps và tích hợp công nghệ bảo vệ bản quyền LicenseGuard tiên tiến nhất.
                            </p>
                            <div className="footer_social">
                                <a href="https://github.com/longnguyen1904"><i className="fa fa-github"></i></a>
                                <a href="#"><i className="fa fa-facebook"></i></a>
                                <a href="#"><i className="fa fa-linkedin"></i></a>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 footer-col">
                        <h4>Hỗ Trợ Developer</h4>
                        <p>Sẵn sàng hỗ trợ 24/7</p>
                        <p>Team kỹ thuật của chúng tôi luôn túc trực để hỗ trợ bạn tích hợp SDK và review Dapp.</p>
                    </div>
                </div>

                <div className="footer-info">
                    <p>
                        &copy; 2026 Bản quyền thuộc về{" "}
                        <a href="https://github.com/longnguyen1904" target="_blank" rel="noopener noreferrer">Long Nguyen (TALLT Team)</a>.
                        <br/> Đồ án môn học SWP391.
                    </p>
                </div>
            </div>
        </footer>
    );
}