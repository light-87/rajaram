"use client";

import React from "react";
import { motion } from "framer-motion";

export default function EducationAndSkills() {
    return (
        <section id="education" className="relative py-20 px-6 lg:px-12 bg-paper overflow-hidden">
            {/* Notebook lines */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e8e4df 31px, #e8e4df 32px)',
            }} />

            <div className="relative z-10 max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* Education Box */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
                >
                    <div className="mb-8">
                        <div className="inline-block bg-orange-100/50 px-6 py-2 rounded-[15px_255px_15px_225px/225px_15px_255px_15px] mb-4">
                            <span className="font-handwritten text-ink/60">academic background</span>
                        </div>
                        <h2 className="font-handwritten text-3xl sm:text-4xl text-ink">
                            Education
                        </h2>
                    </div>

                    <div className="space-y-6">
                        {/* MSc */}
                        <div className="p-6 bg-yellow-50/70 border-2 border-ink/20 rounded-[20px_10px_25px_15px/10px_25px_15px_20px] shadow-sm transform -rotate-1 hover:rotate-0 transition-transform">
                            <h3 className="font-handwritten text-xl text-ink font-bold mb-1">
                                Master of Science in Artificial Intelligence
                            </h3>
                            <p className="font-handwritten text-lg text-ink/70 mb-2">
                                University of Surrey, Guildford
                            </p>
                            <p className="font-handwritten text-sm text-ink/60 mb-3">
                                Feb 2025 — Feb 2026
                            </p>
                            <div className="bg-orange-100 border border-orange-200 px-3 py-2 rounded-md mb-3 inline-block">
                                <p className="font-bold text-orange-800 text-sm">Awarded: Distinction</p>
                                <p className="text-orange-700 text-xs">Semester 1: 74.88% Average | 120 Credits</p>
                            </div>
                            <p className="text-sm text-ink/80 leading-relaxed font-handwritten">
                                <strong>Relevant Modules:</strong> Applied Machine Learning, Computer Vision, Natural Language Processing, AI Programming, Ethics & Regulation of AI.
                            </p>
                        </div>

                        {/* BTech */}
                        <div className="p-6 bg-white/70 border-2 border-ink/20 rounded-[10px_25px_15px_20px/20px_10px_25px_15px] shadow-sm transform rotate-1 hover:rotate-0 transition-transform">
                            <h3 className="font-handwritten text-xl text-ink font-bold mb-1">
                                Bachelor of Technology in Information Technology
                            </h3>
                            <p className="font-handwritten text-lg text-ink/70 mb-2">
                                Savitribai Phule Pune University, Pune
                            </p>
                            <p className="font-handwritten text-sm text-ink/60 mb-3">
                                Aug 2019 — Jul 2023
                            </p>
                            <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-md inline-block">
                                <p className="font-bold text-blue-800 text-sm">CGPA: 9.04/10</p>
                                <p className="text-blue-700 text-xs">First Class with Distinction</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Skills & Achievements Box */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.3 }}
                >
                    <div className="mb-8 mt-12 lg:mt-0">
                        <div className="inline-block bg-teal-100/50 px-6 py-2 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] mb-4">
                            <span className="font-handwritten text-ink/60">technical expertise</span>
                        </div>
                        <h2 className="font-handwritten text-3xl sm:text-4xl text-ink">
                            Skills & Certificates
                        </h2>
                    </div>

                    <div className="p-6 bg-paper border-2 border-ink/30 rounded-[15px_20px_10px_5px/20px_15px_5px_10px] shadow-sketch">

                        {/* Skills Grid */}
                        <div className="space-y-5 mb-8">
                            <div>
                                <h4 className="font-handwritten text-lg text-ink font-bold underline decoration-wavy decoration-teal-300 mb-2">AI / Machine Learning</h4>
                                <p className="text-sm text-ink/80 leading-relaxed font-handwritten">
                                    Deep Learning (Expert), TensorFlow (Expert), PyTorch (Experienced), Transformers (Experienced), Computer Vision (Expert), Feature Engineering, LLMs, NLP
                                </p>
                            </div>

                            <div>
                                <h4 className="font-handwritten text-lg text-ink font-bold underline decoration-wavy decoration-pink-300 mb-2">Full-Stack Development</h4>
                                <p className="text-sm text-ink/80 leading-relaxed font-handwritten">
                                    Python (Experienced), JavaScript/TypeScript (Skillful), Next.js (Experienced), React (Experienced), Svelte (Skillful), Node.js (Experienced), PostgreSQL, MongoDB
                                </p>
                            </div>

                            <div>
                                <h4 className="font-handwritten text-lg text-ink font-bold underline decoration-wavy decoration-yellow-300 mb-2">Tools / Cloud</h4>
                                <p className="text-sm text-ink/80 leading-relaxed font-handwritten">
                                    AWS S3, Cloudflare R2, Supabase, Prisma, Vercel, Git, Docker, LangChain, AI API
                                </p>
                            </div>
                        </div>

                        {/* Achievements */}
                        <div className="pt-6 border-t-2 border-dashed border-ink/20">
                            <h4 className="font-handwritten text-xl text-ink mb-4">Achievements</h4>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-500 mt-1">🏆</span>
                                    <span className="text-sm text-ink/80 leading-relaxed font-handwritten">
                                        <strong>Research Publication (In Progress)</strong> - Protein Phosphorylation Site Prediction
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-500 mt-1">🎓</span>
                                    <span className="text-sm text-ink/80 leading-relaxed font-handwritten">
                                        <strong>DataCamp Data Scientist Professional Certificate</strong> (Jan 2024 - Jan 2026)
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-500 mt-1">🥈</span>
                                    <span className="text-sm text-ink/80 leading-relaxed font-handwritten">
                                        <strong>Runner-up (1st Position)</strong> - Barclays Tech Innovation Intercollegiate Challenge (2022)
                                    </span>
                                </li>
                            </ul>
                        </div>

                    </div>
                </motion.div>

            </div>
        </section>
    );
}
