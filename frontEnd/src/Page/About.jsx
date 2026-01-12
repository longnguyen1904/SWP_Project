import "bootstrap/dist/css/bootstrap.min.css";

import Long from "../public/Long.jpg"
import Vanh from "../public/Vanh.jpg"
import Lam from "../public/Lam.jpg"
import Tam from "../public/Tam.jpg"
import Tu from "../public/Tu.jpg"
import "../Style/About.css"; 

export default function About() {
  const team = [
    {
      id: 1,
      name: "Nguyễn Sỹ Long",
      role: "Project Leader",  
      img: Long 
    },
    {
      id: 2,
      name: "Trần Minh Tâm",
      role: "Frontend Developer",
      img: Tam
    },
    {
      id: 3,
      name: "Tống Việt Anh",
      role: "Backend Developer",
      img: Vanh
    },
    {
      id: 4,
      name: "Trịnh Đình Lâm",
      role: "Database Designer",
      img: Lam
    },
    {
      id: 5,
      name: "Nguyễn Anh Tu",
      role: "QA / Tester",
      img: Tu
    }
  ];

  return (
    <section className="about">
      {/* Hero */}
      <div className="about-hero">
        <h1>Our Team</h1>
        <p>
          Chúng tôi là nhóm sinh viên gồm 5 thành viên, cùng nhau
          xây dựng và phát triển dự án.
        </p>

        {/* English Introduction */}
        <p className="about-intro">
          We are a team of 5 enthusiastic and creative students, collaborating to develop this software project. Each member has a distinct role – from Project Leader, Frontend, Backend, Database to QA/Tester – ensuring the project is executed efficiently, with high quality and on schedule. We are committed to learning, supporting each other, and delivering the best possible product.
        </p>
      </div>

      {/* Team */}
      <div className="about-section gray">
        <div className="team-list">
          {team.map(member => (
            <div className="team-card" key={member.id}>
              <img src={member.img} alt={member.name} />
              <h4>{member.name}</h4>
              <span>{member.role}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
