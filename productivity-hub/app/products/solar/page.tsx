import Link from "next/link";

export const metadata = {
    title: "Solar Sales Manager | Rajaram and Pallavi",
    description:
        "15-step workflow management for solar installation companies.",
};

const steps = [
    { num: 1, title: "Details & Documents", desc: "Customer info, Aadhaar, bills" },
    { num: 2, title: "Online Application", desc: "Submission tracking" },
    { num: 3, title: "Submit to Bank", desc: "Bank documentation" },
    { num: 4, title: "Bank Verification", desc: "Call verification" },
    { num: 5, title: "1st Disbursement", desc: "Initial payment" },
    { num: 6, title: "Material Supplier", desc: "Equipment sourcing" },
    { num: 7, title: "Installation", desc: "Structure and wiring" },
    { num: 8, title: "File Completion", desc: "Photos and specs" },
    { num: 9, title: "Print & Submit", desc: "Finalization" },
    { num: 10, title: "MSEB Inspection", desc: "Government check" },
    { num: 11, title: "Meter Release", desc: "Approval status" },
    { num: 12, title: "Meter Installation", desc: "Completion" },
    { num: 13, title: "Mail Bank", desc: "Communication" },
    { num: 14, title: "Bank Inspection", desc: "Final verification" },
    { num: 15, title: "Final Disbursement", desc: "Project complete" },
];

export default function SolarProductPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="flex items-center justify-between px-6 lg:px-12 py-8 border-b border-border">
                <Link href="/" className="text-xl font-light tracking-wide text-text-primary">
                    Rajaram <span className="text-text-secondary">&</span> Pallavi
                </Link>
                <Link
                    href="/#contact"
                    className="text-sm px-4 py-2 border border-border hover:border-text-secondary text-text-primary transition-colors"
                >
                    Contact
                </Link>
            </nav>

            {/* Hero */}
            <section className="px-6 lg:px-12 py-24 border-b border-border">
                <div className="max-w-4xl">
                    <p className="text-sm text-text-secondary tracking-widest uppercase mb-4">
                        Product
                    </p>
                    <h1 className="text-4xl sm:text-5xl font-light text-text-primary mb-6">
                        Solar Sales Manager
                    </h1>
                    <p className="text-xl text-text-secondary font-light max-w-2xl leading-relaxed mb-8">
                        Complete workflow tracking for solar installation businesses.
                        From first document to final disbursement — every step tracked.
                    </p>
                    <Link
                        href="/#contact"
                        className="inline-block px-8 py-3 border border-text-primary text-text-primary text-sm tracking-wide hover:bg-text-primary hover:text-background transition-colors"
                    >
                        Request Demo
                    </Link>
                </div>
            </section>

            {/* Features */}
            <section className="px-6 lg:px-12 py-16 border-b border-border">
                <div className="max-w-5xl">
                    <p className="text-sm text-text-secondary tracking-widest uppercase mb-8">
                        Capabilities
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: "Finance & Cash", desc: "Both payment types supported" },
                            { title: "Real-time Dashboard", desc: "All projects at a glance" },
                            { title: "Role-based Access", desc: "Admin and employee levels" },
                            { title: "Mobile Ready", desc: "Update from anywhere" },
                            { title: "Auto Document Generation", desc: "Government forms and applications generated automatically" },
                            { title: "MSEB Integration", desc: "Inspection scheduling and meter tracking" },
                            { title: "Bank Coordination", desc: "Disbursement tracking and bank communication" },
                            { title: "Customer Portal", desc: "Customers can track their installation progress" },
                        ].map((feature) => (
                            <div key={feature.title}>
                                <h3 className="text-text-primary font-medium mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-text-secondary text-sm">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 15-Step Workflow */}
            <section className="px-6 lg:px-12 py-16">
                <div className="max-w-5xl">
                    <p className="text-sm text-text-secondary tracking-widest uppercase mb-4">
                        Workflow
                    </p>
                    <h2 className="text-2xl font-light text-text-primary mb-12">
                        15-Step Process
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
                        {steps.map((step) => (
                            <div
                                key={step.num}
                                className="flex items-baseline gap-4 py-3 border-b border-border"
                            >
                                <span className="text-sm text-text-secondary font-mono w-6">
                                    {step.num.toString().padStart(2, '0')}
                                </span>
                                <div>
                                    <p className="text-text-primary text-sm">{step.title}</p>
                                    <p className="text-text-secondary text-xs">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="px-6 lg:px-12 py-24 border-t border-border">
                <div className="max-w-3xl">
                    <h2 className="text-2xl font-light text-text-primary mb-4">
                        Ready to streamline your solar business?
                    </h2>
                    <p className="text-text-secondary mb-8">
                        Stop managing projects in spreadsheets. Get a system built for how you work.
                    </p>
                    <Link
                        href="/#contact"
                        className="inline-block px-8 py-3 border border-text-primary text-text-primary text-sm tracking-wide hover:bg-text-primary hover:text-background transition-colors"
                    >
                        Get in Touch
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 lg:px-12 py-8 border-t border-border">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Link href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                        ← Back
                    </Link>
                    <p className="text-text-secondary text-sm">
                        Rajaram and Pallavi
                    </p>
                </div>
            </footer>
        </div>
    );
}
