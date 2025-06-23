export default function JaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <div data-color-mode="dark">{children}</div>;
}