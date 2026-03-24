import Hero from "@/components/landing/Hero";
import EmploymentHistory from "@/components/landing/EmploymentHistory";
import AcademicProjects from "@/components/landing/AcademicProjects";
import EducationAndSkills from "@/components/landing/EducationAndSkills";
import ProductsShowcase from "@/components/landing/ProductsShowcase";
import AboutSection from "@/components/landing/AboutSection";
import ContactCTA from "@/components/landing/ContactCTA";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <ProductsShowcase />
      <EmploymentHistory />
      <AcademicProjects />
      <EducationAndSkills />
      <AboutSection />
      <ContactCTA />
    </div>
  );
}
