"use client";

export default function AboutSection() {
    return (
        <section id="about" className="relative py-20 px-6 lg:px-12 bg-paper overflow-hidden">
            {/* Notebook lines */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e8e4df 31px, #e8e4df 32px)',
            }} />

            {/* Colorful doodles */}
            {/* Pink circle - top right */}
            <div className="absolute top-16 right-[7%] w-14 h-14 border-3 border-pink-300 rounded-[55%_45%_50%_50%/45%_50%_50%_55%] opacity-35 pointer-events-none" />

            {/* Blue wave - left side */}
            <svg className="absolute top-[30%] left-[4%] w-20 h-14 opacity-25 pointer-events-none" viewBox="0 0 80 50">
                <path d="M5,40 Q20,10 40,25 Q60,40 75,15" fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
            </svg>

            {/* Yellow stars cluster - bottom right */}
            <div className="absolute bottom-24 right-[10%] opacity-30 pointer-events-none">
                <svg className="w-8 h-8" viewBox="0 0 30 30">
                    <path d="M15,2 L17,12 L27,12 L19,18 L22,28 L15,22 L8,28 L11,18 L3,12 L13,12 Z" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
                </svg>
            </div>

            {/* Green triangle - top left */}
            <svg className="absolute top-20 left-[15%] w-10 h-10 opacity-20 pointer-events-none" viewBox="0 0 40 40">
                <path d="M20,5 L35,35 L5,35 Z" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinejoin="round" />
            </svg>

            {/* Coral dots - bottom left */}
            <div className="absolute bottom-16 left-[8%] opacity-30 pointer-events-none">
                <div className="w-4 h-4 bg-rose-300 rounded-full" />
                <div className="w-2 h-2 bg-rose-400 rounded-full ml-5 mt-2" />
            </div>

            {/* Purple loop - right side */}
            <svg className="absolute top-[60%] right-[5%] w-12 h-16 opacity-20 pointer-events-none" viewBox="0 0 50 70">
                <path d="M25,5 C40,5 45,20 45,35 C45,50 35,65 20,65 C5,65 5,50 5,35" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
            </svg>

            <div className="relative z-10 max-w-4xl mx-auto">
                {/* Section header */}
                <div className="mb-12 text-center">
                    <div className="inline-block bg-green-100/50 px-6 py-2 rounded-[15px_255px_15px_225px/225px_15px_255px_15px] mb-4">
                        <span className="font-handwritten text-ink/60">who we are</span>
                    </div>
                    <h2 className="font-handwritten text-4xl sm:text-5xl text-ink">
                        About Us
                    </h2>
                </div>

                {/* Content as "written notes" */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Philosophy - like a journal entry */}
                    <div className="space-y-6">
                        <div className="p-6 bg-yellow-50/50 border-l-4 border-orange-400 rounded-r-[5px_15px_10px_5px/10px_5px_5px_15px]">
                            <h3 className="font-handwritten text-xl text-ink mb-4 underline decoration-wavy decoration-orange-300 underline-offset-4">
                                Our Philosophy
                            </h3>
                            <div className="font-handwritten text-ink/80 space-y-4 leading-relaxed">
                                <p>
                                    Every local business owner deserves tools that work as hard as they do.
                                </p>
                                <p>
                                    Not complex enterprise software. Not generic apps. But systems designed
                                    for how YOU actually work.
                                </p>
                                <p>
                                    → Water purifier techs forget service calls
                                    <br />
                                    → Factory owners drown in paper registers
                                    <br />
                                    → Solar vendors juggle spreadsheets
                                </p>
                                <p className="text-ink font-medium">
                                    We build software that solves these specific problems. ✓
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Founder - like a sticky note */}
                    <div>
                        <div className="relative p-6 bg-blue-50/70 rounded-[15px_10px_20px_10px/10px_20px_10px_15px] rotate-[1deg] shadow-sm border border-blue-200/50">
                            {/* Pin doodle */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-400 rounded-full border-2 border-red-500 shadow-sm" />

                            <div className="pt-2">
                                <p className="font-handwritten text-ink/50 text-sm mb-2">👋 hi, I&apos;m</p>
                                <h3 className="font-handwritten text-2xl text-ink mb-1">
                                    Vaibhav Talekar
                                </h3>
                                <p className="font-handwritten text-ink/60 mb-4">
                                    Developer & Problem Solver
                                </p>

                                <div className="font-handwritten text-ink/80 space-y-3 leading-relaxed">
                                    <p>
                                        I build complete business systems — from inventory tracking
                                        to automated workflows.
                                    </p>
                                    <p>
                                        Each product comes from real conversations with business owners,
                                        understanding daily struggles, building what actually fits.
                                    </p>
                                </div>

                                {/* Tech stack as doodle tags */}
                                <div className="flex flex-wrap gap-2 mt-6">
                                    {["Next.js", "React", "Node.js", "PostgreSQL"].map((tech) => (
                                        <span
                                            key={tech}
                                            className="font-handwritten text-sm px-3 py-1 bg-white/60 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] text-ink/60"
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
