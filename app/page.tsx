import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import PlatformPreview from "./components/PlatformPreview";
import Features from "./components/Features";
import Dashboards from "./components/Dashboards";
import Pricing from "./components/Pricing";
import Testimonials from "./components/Testimonials";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import FAQ from "./components/FAQ";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <PlatformPreview />
      <Features />
      <Dashboards />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
