"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const products = [
    {
        num: "01",
        name: "Solar Sales Manager",
        tagline: "For solar installers",
        description: "Track every installation through 15 steps — from first document to final payment. Automatic government document generation, finance customers, cash deals, MSEB inspections — all in one place.",
        href: "http://saundaryaroof.homes/",
        external: true,
        doodle: "☀️",
    },
    {
        num: "02",
        name: "BaahiAI",
        tagline: "India's smartest voice-driven expense tracker",
        description: "Zero typing required. Speak in 11 Indian languages to log deliveries and payments instantly. Uses AI compound queries to update everything seamlessly.",
        href: "https://baahi.work",
        external: true,
        doodle: "🎙️",
    },
    {
        num: "03",
        name: "Kuberbook",
        tagline: "For service vendors",
        description: "Water purifier techs, AC service, appliance dealers — automatic reminders, digital bills, WhatsApp messages. Never lose a customer to forgotten maintenance.",
        href: "https://kuberbook.shop",
        external: true,
        doodle: "💧",
    },
    {
        num: "04",
        name: "PMR ERP System",
        tagline: "Enterprise resource planning",
        description: "Built for PMR Industries managing multi-warehouse inventory (3 warehouses), production workflows, financial tracking with 5 account types, and automated Google Drive backups.",
        href: "#contact",
        external: false,
        doodle: "🏭",
    },
];

export default function ProductsShowcase() {
    return (
        <section id="products" className="relative py-20 px-6 lg:px-12 bg-paper overflow-hidden">
            {/* Notebook lines */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e8e4df 31px, #e8e4df 32px)',
            }} />

            {/* Colorful doodles */}
            {/* Red wavy line - top right */}
            <svg className="absolute top-12 right-[8%] w-28 h-10 opacity-30 pointer-events-none" viewBox="0 0 120 40">
                <path d="M5,20 Q30,5 55,20 T105,20" fill="none" stroke="#f87171" strokeWidth="3" strokeLinecap="round" />
            </svg>

            {/* Cyan diamond - left side */}
            <svg className="absolute top-[40%] left-[3%] w-10 h-10 opacity-25 pointer-events-none" viewBox="0 0 40 40">
                <path d="M20,2 L38,20 L20,38 L2,20 Z" fill="none" stroke="#22d3d3" strokeWidth="2" strokeLinejoin="round" />
            </svg>

            {/* Orange dots cluster - bottom right */}
            <div className="absolute bottom-20 right-[6%] opacity-35 pointer-events-none">
                <div className="w-5 h-5 bg-orange-300 rounded-full mb-3" />
                <div className="w-3 h-3 bg-orange-400 rounded-full ml-6" />
                <div className="w-4 h-4 bg-orange-200 rounded-full -ml-2 mt-2" />
            </div>

            {/* Purple cross/plus - top left */}
            <svg className="absolute top-24 left-[12%] w-8 h-8 opacity-25 pointer-events-none" viewBox="0 0 30 30">
                <path d="M15,5 L15,25 M5,15 L25,15" fill="none" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" />
            </svg>

            {/* Green squiggle - bottom left */}
            <svg className="absolute bottom-32 left-[10%] w-16 h-10 opacity-30 pointer-events-none" viewBox="0 0 70 40">
                <path d="M5,30 Q20,10 35,25 Q50,40 65,15" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" />
            </svg>

            <div className="relative z-10 max-w-4xl mx-auto">
                {/* Section header with hand-drawn box */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="mb-16 text-center"
                >
                    <div className="inline-block bg-blue-100/50 px-6 py-2 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] mb-4">
                        <span className="font-handwritten text-ink/60">my work</span>
                    </div>
                    <h2 className="font-handwritten text-4xl sm:text-5xl text-ink">
                        Featured Projects
                    </h2>
                </motion.div>

                {/* Products as notebook entries */}
                <div className="space-y-12">
                    {products.map((product, idx) => (
                        <motion.div
                            initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, delay: idx * 0.1, type: "spring", bounce: 0.3 }}
                            key={product.name}
                        >
                            <Link
                                href={product.href}
                                target={product.external ? "_blank" : undefined}
                                rel={product.external ? "noopener noreferrer" : undefined}
                                className="group block"
                            >
                                <div className="relative p-6 sm:p-8 bg-paper border-2 border-ink/20 rounded-[10px_25px_15px_20px/20px_10px_25px_15px] hover:border-ink/40 hover:shadow-sketch transition-all hover:rotate-[0.3deg]">
                                    {/* Number in margin */}
                                    <span className="absolute -left-4 top-6 font-handwritten text-2xl text-ink/30">
                                        {product.num}
                                    </span>

                                    {/* Doodle */}
                                    <span className="absolute -right-2 -top-2 text-3xl">
                                        {product.doodle}
                                    </span>

                                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-baseline gap-3 mb-2">
                                                <h3 className="font-handwritten text-2xl text-ink group-hover:text-orange-600 transition-colors">
                                                    {product.name}
                                                </h3>
                                                <span className="font-handwritten text-ink/50 text-sm">
                                                    ({product.tagline})
                                                </span>
                                                {product.external && (
                                                    <span className="font-handwritten text-ink/40 text-sm">↗</span>
                                                )}
                                            </div>
                                            <p className="font-handwritten text-ink/70 leading-relaxed">
                                                {product.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Hand-drawn arrow on hover */}
                                    <svg className="absolute right-6 bottom-6 w-8 h-8 text-ink/20 group-hover:text-orange-500 transition-colors" viewBox="0 0 30 30">
                                        <path d="M5,25 Q15,20 25,10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        <path d="M18,8 L25,10 L23,17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
