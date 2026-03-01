"use client";
import { motion } from "framer-motion";

const academicProjects = [
    {
        title: "Protein Phosphorylation Site Prediction",
        type: "MSc Thesis Project - Research Paper Under Review with Positive Feedback",
        period: "Mar 2025 — Present",
        location: "Guildford",
        points: [
            "Achieved 82.8% accuracy using novel ensemble approach combining feature engineering with transformer models.",
            "Implemented ESM2 transformer (Facebook's protein language model) with optimized performance.",
            "Conducted 100+ experiments across XGBoost, deep learning, and ensemble methods.",
            "Developed comprehensive feature extraction pipeline with 5x faster processing through optimization."
        ],
        tags: ["PyTorch", "Transformers", "ESM2", "XGBoost", "Deep Learning"]
    },
    {
        title: "Glaucoma Detection using Deep Learning",
        type: "Team Leader - 31% Contribution",
        period: "Apr 2025 — Jun 2025",
        location: "Guildford",
        points: [
            "Led team of 4 developing automated glaucoma detection achieving 94.7% Dice score and 90% IoU.",
            "Implemented multiple architectures (UNet, FPN, DeepLabV3+, SegFormer) with comparative analysis.",
            "Optimized loss functions using Dice-Focal combination addressing class imbalance.",
            "Delivered clinically relevant solution with Cup-to-Disc Ratio estimation."
        ],
        tags: ["Computer Vision", "UNet", "Medical Imaging", "Deep Learning"]
    },
    {
        title: "Network Intrusion Detection System",
        type: "Academic Project",
        period: "Apr 2025 — Jun 2025",
        location: "Guildford",
        points: [
            "Developed RBFN model from scratch achieving 92.37% training and 88.6% testing accuracy.",
            "Implemented comprehensive preprocessing including feature selection and standardization.",
            "Performed hyperparameter optimization using grid search, improving accuracy to 90.58%."
        ],
        tags: ["Machine Learning", "RBFN", "Cybersecurity", "Grid Search"]
    }
];

export default function AcademicProjects() {
    return (
        <section id="research" className="relative py-20 px-6 lg:px-12 bg-paper overflow-hidden">
            {/* Notebook lines */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e8e4df 31px, #e8e4df 32px)',
            }} />

            <div className="relative z-10 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, type: "spring" }}
                    className="mb-16 text-center"
                >
                    <div className="inline-block bg-blue-100/50 px-6 py-2 rounded-[15px_255px_15px_225px/225px_15px_255px_15px] mb-4">
                        <span className="font-handwritten text-ink/60">deep learning & research</span>
                    </div>
                    <h2 className="font-handwritten text-4xl sm:text-5xl text-ink">
                        Academic Projects
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 gap-8">
                    {academicProjects.map((project, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 50, rotate: idx % 2 === 0 ? -2 : 2 }}
                            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, delay: idx * 0.15, type: "spring", bounce: 0.4 }}
                            key={idx}
                            className="relative p-6 sm:p-8 bg-paper border-2 border-ink/20 rounded-[10px_25px_15px_20px/20px_10px_25px_15px] hover:border-ink/50 hover:shadow-sketch transition-all group"
                        >
                            {/* Pin doodle for top-left */}
                            <div className="absolute -top-3 -left-3 w-8 h-8 opacity-40 group-hover:opacity-80 transition-opacity">
                                <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" className="text-red-500" strokeWidth="2">
                                    <path d="M20,5 L20,15 M15,10 L25,10" />
                                    <circle cx="20" cy="10" r="8" fill="#fca5a5" />
                                </svg>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                <div>
                                    <h3 className="font-handwritten text-2xl text-ink group-hover:text-green-700 transition-colors">
                                        {project.title}
                                    </h3>
                                    <p className="font-handwritten text-lg text-ink/60">
                                        {project.type}
                                    </p>
                                </div>
                                <span className="font-handwritten text-sm text-ink/50 whitespace-nowrap">{project.period}</span>
                            </div>

                            <ul className="space-y-2 mb-6 ml-2 border-l-2 border-ink/10 pl-4 py-2">
                                {project.points.map((point, ptIdx) => (
                                    <li key={ptIdx} className="text-ink/80 text-[15px] leading-relaxed relative">
                                        <span className="absolute -left-6 top-[6px] w-2 h-2 bg-green-200 border border-green-500 rounded-full" />
                                        {point}
                                    </li>
                                ))}
                            </ul>

                            <div className="flex flex-wrap gap-2">
                                {project.tags.map((tag) => (
                                    <span key={tag} className="font-handwritten text-sm px-3 py-1 bg-green-50 border border-green-200/50 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] text-green-800/70">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
