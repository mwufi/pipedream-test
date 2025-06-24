export default function DebugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark fixed inset-0 bg-[#0a0a0a]">
      {children}
    </div>
  );
}