import AuthGuard from "@/components/AuthGuard";

export default function VaibhavLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AuthGuard>{children}</AuthGuard>;
}
