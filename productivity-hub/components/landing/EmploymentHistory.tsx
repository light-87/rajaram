"use client";
import { motion } from "framer-motion";

const experiences = [
    {
        title: "Freelance Software Developer & AI Automation Specialist",
        company: "Independent Consultant",
        location: "Guildford",
        period: "Nov 2025 — Present",
        description: "Business Automation & AI Solutions",
        points: [
            "Developed and sold commercial full-stack applications to multiple business clients, generating revenue through custom automation solutions and ERP systems.",
            "Built enterprise ERP system for PMR Industries managing multi-warehouse inventory, production workflows (Urea → DEF conversion), and financial tracking.",
            "Architected Solar Sales Management System with 15-step workflow tracker, role-based authentication, and RESTful APIs using Supabase.",
            "Created AI-driven business outreach platform with custom prompt engineering for automated email generation and real-time streaming search."
        ],
        techStack: ["Next.js 15", "TypeScript", "React", "PostgreSQL", "Supabase", "AWS S3", "AI API"]
    },
    {
        title: "Software Developer (AI Specialist)",
        company: "zzish (Marvely)",
        location: "Guildford",
        period: "Feb 2025 — Nov 2025",
        description: "EdTech Company - AI-powered language learning platform",
        points: [
            "Led AI backend development for multi-language speaking practice platform serving GCSE, IGCSE, and IELTS preparation.",
            "Architected speech generation, feedback systems, and automated reporting using advanced NLP models.",
            "Built complete V2 platform using Svelte 5, delivering 40% faster performance and enhanced error handling.",
            "Integrated payment systems and developed scalable backend infrastructure supporting thousands of users."
        ],
        techStack: ["Svelte", "Node.js", "Python", "NLP", "Machine Learning"]
    },
    {
        title: "Subject Matter Expert (Data Science)",
        company: "Scaler Academy",
        location: "Bengaluru",
        period: "Mar 2022 — Feb 2025",
        description: "",
        points: [
            "Developed computer vision modules leveraging machine learning techniques for enhanced image analysis.",
            "Designed machine learning models using complex algorithms to solve intricate problem domains.",
            "Contributed to curriculum development, integrating cutting-edge technologies to enhance student learning experience."
        ],
        techStack: ["Python", "Computer Vision", "Machine Learning", "Data Science"]
    }
];

export default function EmploymentHistory() {
    return (
        <section id="experience" className="relative py-20 px-6 lg:px-12 bg-paper overflow-hidden">
            {/* Notebook lines */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e8e4df 31px, #e8e4df 32px)',
            }} />

            {/* Colorful doodles */}
            <svg className="absolute top-12 left-[10%] w-20 h-10 opacity-30 pointer-events-none" viewBox="0 0 80 40">
                <path d="M5,20 Q20,5 35,20 T65,20" fill="none" stroke="#f472b6" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div className="absolute bottom-20 right-[8%] opacity-35 pointer-events-none">
                <div className="w-4 h-4 bg-teal-300 rounded-full mb-3" />
                <div className="w-2 h-2 bg-teal-400 rounded-full ml-5" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="mb-16 text-center"
                >
                    <div className="inline-block bg-purple-100/50 px-6 py-2 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] mb-4">
                        <span className="font-handwritten text-ink/60">career journey</span>
                    </div>
                    <h2 className="font-handwritten text-4xl sm:text-5xl text-ink">
                        Employment History
                    </h2>
                </motion.div>

                <div className="space-y-12 relative">
                    {/* Vertical timeline line (drawn style) */}
                    <motion.div
                        initial={{ height: 0 }}
                        whileInView={{ height: 'auto' }}
                        viewport={{ once: true, margin: "-20%" }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute left-[20px] sm:left-[38px] top-4 bottom-4 w-1 bg-ink/10 rounded-full hidden sm:block overflow-hidden"
                    >
                    </motion.div>

                    {experiences.map((exp, index) => (
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.7, delay: index * 0.2, type: "spring", bounce: 0.3 }}
                            key={index} className="relative sm:pl-[80px]"
                        >
                            {/* Timeline dot */}
                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 + 0.3, type: "spring" }}
                                className="absolute left-[31px] top-6 w-4 h-4 bg-paper border-4 border-orange-400 rounded-full z-10 hidden sm:block shadow-sm"
                            ></motion.div>

                            <div className="p-6 sm:p-8 bg-white/60 backdrop-blur-sm border-2 border-ink/20 rounded-[10px_25px_15px_20px/20px_10px_25px_15px] hover:border-ink/40 transition-all hover:-translate-y-1 group">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4">
                                    <div>
                                        <h3 className="font-handwritten text-2xl text-ink group-hover:text-blue-700 transition-colors">
                                            {exp.title}
                                        </h3>
                                        <p className="font-handwritten text-lg text-ink/70">
                                            {exp.company} {exp.location && <span>• {exp.location}</span>}
                                        </p>
                                    </div>
                                    <div className="inline-block px-4 py-1 bg-yellow-100/60 rounded-[15px_255px_15px_225px/225px_15px_255px_15px] border border-orange-200">
                                        <span className="font-handwritten text-sm text-ink/80">{exp.period}</span>
                                    </div>
                                </div>

                                {exp.description && (
                                    <p className="font-handwritten text-ink/60 mb-4 italic">
                                        {exp.description}
                                    </p>
                                )}

                                <ul className="space-y-3 mb-6">
                                    {exp.points.map((point, ptIdx) => (
                                        <li key={ptIdx} className="flex items-start gap-3 text-ink/80">
                                            <span className="text-orange-400 mt-1 flex-shrink-0">›</span>
                                            <span className="leading-relaxed text-[15px]">{point}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="flex flex-wrap gap-2 pt-4 border-t-2 border-dashed border-ink/10">
                                    {exp.techStack.map((tech) => (
                                        <span key={tech} className="font-handwritten text-sm px-3 py-1 bg-blue-50 border border-blue-200/50 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] text-blue-800/70">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
