import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Categories } from "@/components/landing/Categories";
import { Comparison } from "@/components/landing/Comparison";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <div className="relative overflow-x-hidden" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
      <Nav />
      <Hero />
      <HowItWorks />
      <Categories />
      <Comparison />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
