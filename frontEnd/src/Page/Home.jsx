
import Hero from "../Component/Hero";
import Events from "../Component/Events";
import Traditions from "../Component/Traditions";
import Subscribe from "../Component/Subscribe";
import Footer from "../Component/Footers";
import FilterList from "../Component/FilterList";



export default function HomePage() {
  return (
    <div className="app snow">
      <Hero />
      <FilterList />
      <Events />
      <Traditions />
      <Subscribe />
      <Footer />
    </div>
  );
}