"use client";

import Link from "next/link";

export default function ContactCTA() {
    const whatsappNumber = "918975706582";
    const whatsappMessage = encodeURIComponent(
        "Hi! I'd like to discuss a software solution for my business."
    );
    const email = "vaibhavtalekar87@gmail.com";

    return (
        <section id="contact" className="relative py-20 px-6 lg:px-12 bg-paper overflow-hidden">
            {/* Notebook lines */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e8e4df 31px, #e8e4df 32px)',
            }} />

            {/* Colorful doodles */}
            {/* Teal circle - top left */}
            <div className="absolute top-12 left-[6%] w-12 h-12 border-3 border-teal-300 rounded-[50%_45%_55%_50%/55%_50%_50%_45%] opacity-35 pointer-events-none" />

            {/* Orange zigzag - top right */}
            <svg className="absolute top-16 right-[10%] w-24 h-10 opacity-30 pointer-events-none" viewBox="0 0 100 40">
                <path d="M5,20 L25,8 L45,32 L65,8 L85,28 L95,15" fill="none" stroke="#fb923c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            {/* Pink heart - left side */}
            <svg className="absolute top-[40%] left-[4%] w-10 h-10 opacity-25 pointer-events-none" viewBox="0 0 50 50">
                <path d="M25,45 C15,35 5,25 5,15 C5,8 10,3 17,3 C22,3 25,8 25,8 C25,8 28,3 33,3 C40,3 45,8 45,15 C45,25 35,35 25,45 Z" fill="none" stroke="#f472b6" strokeWidth="2" />
            </svg>

            {/* Blue dots - bottom left */}
            <div className="absolute bottom-20 left-[12%] opacity-30 pointer-events-none">
                <div className="w-3 h-3 bg-sky-400 rounded-full" />
                <div className="w-4 h-4 bg-sky-300 rounded-full ml-4 mt-3" />
                <div className="w-2 h-2 bg-sky-500 rounded-full -ml-1 mt-2" />
            </div>

            {/* Green spiral - right side */}
            <svg className="absolute top-[55%] right-[6%] w-14 h-14 opacity-25 pointer-events-none" viewBox="0 0 60 60">
                <path d="M30,30 C30,24 36,18 42,18 C50,18 54,26 54,34 C54,46 42,54 30,54 C14,54 6,42 6,30 C6,14 18,4 34,4" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
            </svg>

            {/* Yellow star - bottom right */}
            <svg className="absolute bottom-16 right-[15%] w-10 h-10 opacity-25 pointer-events-none" viewBox="0 0 40 40">
                <path d="M20,4 L23,16 L35,16 L25,23 L29,35 L20,27 L11,35 L15,23 L5,16 L17,16 Z" fill="none" stroke="#facc15" strokeWidth="2" />
            </svg>

            <div className="relative z-10 max-w-3xl mx-auto">
                {/* Main CTA box - like a torn paper note */}
                <div className="relative p-8 sm:p-12 bg-orange-50/70 border-2 border-ink/30 rounded-[20px_10px_25px_15px/10px_25px_15px_20px]">
                    {/* Corner fold effect */}
                    <div className="absolute top-0 right-0 w-12 h-12 bg-paper border-b-2 border-l-2 border-ink/20 rounded-bl-lg"
                        style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }} />

                    <div className="text-center mb-8">
                        <h2 className="font-handwritten text-3xl sm:text-4xl text-ink mb-4">
                            Let&apos;s build something together? 🤝
                        </h2>
                        <p className="font-handwritten text-ink/70 max-w-md mx-auto">
                            Whether you need one of our products or a completely custom solution —
                            reach out. No hard sell, just a conversation.
                        </p>
                    </div>

                    {/* Contact cards - like index cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link
                            href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group p-5 bg-green-50 border-2 border-green-300 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] hover:border-green-500 hover:bg-green-100/50 transition-all hover:rotate-[-1deg]"
                        >
                            <p className="font-handwritten text-green-700 text-sm mb-1">WhatsApp</p>
                            <p className="font-handwritten text-ink text-lg group-hover:text-green-700 transition-colors">
                                +91 8975 706 582
                            </p>
                        </Link>

                        <Link
                            href={`mailto:${email}`}
                            className="group p-5 bg-blue-50 border-2 border-blue-300 rounded-[15px_255px_15px_225px/225px_15px_255px_15px] hover:border-blue-500 hover:bg-blue-100/50 transition-all hover:rotate-[1deg]"
                        >
                            <p className="font-handwritten text-blue-700 text-sm mb-1">Email</p>
                            <p className="font-handwritten text-ink text-lg group-hover:text-blue-700 transition-colors">
                                {email}
                            </p>
                        </Link>
                    </div>
                </div>

                {/* Footer - casual sign-off */}
                <div className="mt-16 text-center">
                    <p className="font-handwritten text-ink/40">
                        — Rajaram & Pallavi —
                    </p>
                    <p className="font-handwritten text-ink/30 text-sm mt-2">
                        Maharashtra, India
                    </p>
                </div>
            </div>
        </section>
    );
}
