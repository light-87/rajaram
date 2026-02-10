"use client";

import Link from "next/link";
import { useState } from "react";

export default function Hero() {
    const [loginOpen, setLoginOpen] = useState(false);

    return (
        <section className="relative min-h-screen bg-paper">
            {/* Paper texture overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmZmZmIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmOGY4ZjgiPjwvcmVjdD4KPC9zdmc+')] opacity-50" />

            {/* Notebook lines - subtle horizontal lines */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #e8e4df 31px, #e8e4df 32px)',
                backgroundPosition: '0 80px'
            }} />

            {/* Colorful doodle shapes in background */}
            {/* Orange circle - top left */}
            <div className="absolute top-16 left-[8%] w-20 h-20 border-4 border-orange-300 rounded-[60%_40%_55%_45%/45%_55%_40%_60%] opacity-40 pointer-events-none" />

            {/* Blue squiggle - top right */}
            <svg className="absolute top-32 right-[12%] w-24 h-16 opacity-30 pointer-events-none" viewBox="0 0 100 50">
                <path d="M5,25 Q25,5 45,25 T85,25" fill="none" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" />
            </svg>

            {/* Green circle - bottom left */}
            <div className="absolute bottom-40 left-[5%] w-16 h-16 border-4 border-green-400 rounded-[45%_55%_50%_50%/55%_50%_50%_45%] opacity-35 pointer-events-none" />

            {/* Pink star - right side */}
            <svg className="absolute top-[45%] right-[6%] w-14 h-14 opacity-30 pointer-events-none" viewBox="0 0 50 50">
                <path d="M25,2 L30,20 L48,20 L34,32 L40,48 L25,38 L10,48 L16,32 L2,20 L20,20 Z" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinejoin="round" />
            </svg>

            {/* Yellow zigzag - bottom right */}
            <svg className="absolute bottom-28 right-[20%] w-20 h-8 opacity-40 pointer-events-none" viewBox="0 0 80 30">
                <path d="M5,15 L20,5 L35,25 L50,5 L65,25 L75,10" fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            {/* Purple dots - left side */}
            <div className="absolute top-[55%] left-[4%] opacity-30 pointer-events-none">
                <div className="w-4 h-4 bg-purple-400 rounded-full mb-2" />
                <div className="w-3 h-3 bg-purple-300 rounded-full ml-4" />
                <div className="w-2 h-2 bg-purple-400 rounded-full ml-1 mt-1" />
            </div>

            {/* Coral heart - top center-right */}
            <svg className="absolute top-24 left-[40%] w-8 h-8 opacity-25 pointer-events-none" viewBox="0 0 50 50">
                <path d="M25,45 C15,35 5,25 5,15 C5,8 10,3 17,3 C22,3 25,8 25,8 C25,8 28,3 33,3 C40,3 45,8 45,15 C45,25 35,35 25,45 Z" fill="none" stroke="#fb7185" strokeWidth="2" />
            </svg>

            {/* Teal spiral - bottom left area */}
            <svg className="absolute bottom-[35%] left-[15%] w-12 h-12 opacity-25 pointer-events-none" viewBox="0 0 50 50">
                <path d="M25,25 C25,20 30,15 35,15 C42,15 45,22 45,28 C45,38 35,45 25,45 C12,45 5,35 5,25 C5,12 15,3 28,3" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" />
            </svg>

            {/* Navigation */}
            <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6">
                <Link href="/" className="flex items-center gap-2">
                    <span className="font-handwritten text-2xl text-ink">
                        Rajaram & Pallavi
                    </span>
                </Link>

                <div className="flex items-center gap-6">
                    <Link href="#products" className="font-handwritten text-ink/70 hover:text-ink transition-colors hidden sm:block">
                        Products
                    </Link>
                    <Link href="#about" className="font-handwritten text-ink/70 hover:text-ink transition-colors hidden sm:block">
                        About
                    </Link>
                    <Link href="#contact" className="font-handwritten text-ink/70 hover:text-ink transition-colors hidden sm:block">
                        Contact
                    </Link>

                    {/* Login Button - Sketchy style */}
                    <div className="relative">
                        <button
                            onClick={() => setLoginOpen(!loginOpen)}
                            className="font-handwritten px-5 py-2 text-ink border-2 border-ink rounded-[255px_15px_225px_15px/15px_225px_15px_255px] hover:bg-ink/5 transition-colors"
                        >
                            Login
                        </button>
                        {loginOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setLoginOpen(false)} />
                                <div className="absolute right-0 mt-3 w-52 bg-paper border-2 border-ink rounded-[15px_255px_15px_225px/225px_15px_255px_15px] shadow-sketch z-50 overflow-hidden">
                                    <Link
                                        href="/vaibhav"
                                        onClick={() => setLoginOpen(false)}
                                        className="block px-5 py-4 font-handwritten text-ink hover:bg-yellow-100/50 transition-colors border-b-2 border-ink/30 border-dashed"
                                    >
                                        ✏️ Personal Dashboard
                                    </Link>
                                    <Link
                                        href="/tools"
                                        onClick={() => setLoginOpen(false)}
                                        className="block px-5 py-4 font-handwritten text-ink hover:bg-blue-100/50 transition-colors"
                                    >
                                        🔧 Employee Tools
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-6 text-center">
                {/* Hand-drawn circle decoration */}
                <div className="absolute top-20 right-20 w-32 h-32 border-3 border-ink/20 rounded-[50%_45%_55%_50%/50%_55%_45%_50%] hidden lg:block" />
                <div className="absolute bottom-32 left-16 w-16 h-16 border-2 border-ink/15 rounded-[45%_55%_50%_50%/55%_50%_50%_45%] hidden lg:block" />

                {/* Arrow doodle */}
                <svg className="absolute bottom-40 right-32 w-20 h-20 text-ink/20 hidden lg:block" viewBox="0 0 100 100">
                    <path d="M20,80 Q40,60 60,50 T90,30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M75,25 L90,30 L85,45" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                <div className="max-w-3xl">
                    {/* Tagline with underline doodle */}
                    <p className="font-handwritten text-lg text-ink/60 mb-4">
                        ~ for local business owners ~
                    </p>

                    {/* Main Headline */}
                    <h1 className="font-handwritten text-4xl sm:text-5xl lg:text-6xl text-ink leading-tight mb-6">
                        Software that runs
                        <br />
                        <span className="relative inline-block">
                            your business
                            {/* Hand-drawn underline */}
                            <svg className="absolute -bottom-2 left-0 w-full h-4" viewBox="0 0 200 20" preserveAspectRatio="none">
                                <path d="M0,10 Q50,0 100,10 T200,10" fill="none" stroke="#e85d04" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        </span>
                    </h1>

                    {/* Subtext in a "note" style box */}
                    <div className="inline-block bg-yellow-100/60 px-8 py-4 my-8 rounded-[5px_10px_15px_5px/10px_5px_5px_15px] rotate-[-0.5deg] border-l-4 border-orange-400">
                        <p className="font-handwritten text-lg text-ink/80">
                            Inventory, reminders, billing, customers — all automated.
                            <br />
                            So you can focus on what you do best.
                        </p>
                    </div>

                    {/* CTAs - Sketchy buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                        <Link
                            href="#products"
                            className="font-handwritten px-8 py-3 bg-ink text-paper rounded-[255px_15px_225px_15px/15px_225px_15px_255px] hover:bg-ink/90 transition-colors"
                        >
                            See What We Build →
                        </Link>
                        <Link
                            href="#contact"
                            className="font-handwritten px-8 py-3 text-ink border-2 border-ink rounded-[15px_255px_15px_225px/225px_15px_255px_15px] hover:bg-ink/5 transition-colors"
                        >
                            Get in Touch
                        </Link>
                    </div>
                </div>

                {/* Scroll hint - hand drawn arrow */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                    <svg className="w-8 h-12 text-ink/40" viewBox="0 0 30 50">
                        <path d="M15,5 L15,35 M8,28 L15,38 L22,28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
        </section>
    );
}
