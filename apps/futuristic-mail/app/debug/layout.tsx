export default function DebugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark bg-[#0a0a0a]">
      {children}
    </div>
  );
}