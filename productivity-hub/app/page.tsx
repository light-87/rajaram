"use client";

import { useScroll, useTransform, motion, useSpring } from "framer-motion";
import { useRef } from "react";
import Hero from "@/components/landing/Hero";
import EmploymentHistory from "@/components/landing/EmploymentHistory";
import AcademicProjects from "@/components/landing/AcademicProjects";
import EducationAndSkills from "@/components/landing/EducationAndSkills";
import ProductsShowcase from "@/components/landing/ProductsShowcase";
import AboutSection from "@/components/landing/AboutSection";
import ContactCTA from "@/components/landing/ContactCTA";

const SECTIONS = [
  { component: Hero, id: "hero" },
  { component: EmploymentHistory, id: "employment" },
  { component: AcademicProjects, id: "projects" },
  { component: ProductsShowcase, id: "products" },
  { component: EducationAndSkills, id: "skills" },
  { component: AboutSection, id: "about" },
  { component: ContactCTA, id: "contact" },
];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // rotation per section for a 7-sided prism
  const anglePerSection = 360 / SECTIONS.length;
  const totalRotation = 360 - anglePerSection; // Rotate to the last section

  // Create a mapping that snaps or smoothly rotates between faces
  const rotationX = useTransform(smoothProgress, [0, 1], [0, -totalRotation]);

  return (
    <div ref={containerRef} className="relative h-[800vh] bg-background">
      {/* Perspective wrapper */}
      <div className="sticky top-0 h-screen w-full overflow-hidden" style={{ perspective: "2500px" }}>
        <motion.div
          style={{
            rotateX: rotationX,
            transformStyle: "preserve-3d",
            height: "100%",
            width: "100%",
          }}
          className="relative flex items-center justify-center"
        >
          {SECTIONS.map((Section, idx) => (
            <SectionFace key={Section.id} index={idx} total={SECTIONS.length}>
              <Section.component />
            </SectionFace>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function SectionFace({ children, index, total }: { children: React.ReactNode; index: number; total: number }) {
  const angle = (360 / total) * index;

  // Radius for the heptagonal prism so edges meet:
  // r = (h / 2) / tan(PI / 7)
  // 100vh / 2 = 50vh. tan(PI / 7) approx 0.4815
  // radius approx 103.8vh
  const radius = "103.8vh";

  return (
    <motion.div
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        backfaceVisibility: "hidden",
        transform: `rotateX(${angle}deg) translateZ(${radius})`,
      }}
      className="top-0 left-0"
    >
      <div className="h-full w-full overflow-y-auto custom-scrollbar bg-background">
        {children}
      </div>
    </motion.div>
  );
}
