import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-8 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-gradient-pink-purple">
          Rajaram and Pallavi
        </h1>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto">
          Innovating the future, one project at a time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Link
          href="/vaibhav"
          className="p-8 rounded-2xl bg-background-card border border-border/50 hover:border-pink/50 transition-all group"
        >
          <h2 className="text-2xl font-bold text-text-primary group-hover:text-pink transition-colors">
            Personal Tracker
          </h2>
          <p className="text-text-secondary mt-2">
            Access your private productivity tools. PIN required.
          </p>
        </Link>

        <Link
          href="/tools"
          className="p-8 rounded-2xl bg-background-card border border-border/50 hover:border-sky/50 transition-all group"
        >
          <h2 className="text-2xl font-bold text-text-primary group-hover:text-sky transition-colors">
            Employee Tools
          </h2>
          <p className="text-text-secondary mt-2">
            Management and sales tools for our team.
          </p>
        </Link>
      </div>
    </div>
  );
}
