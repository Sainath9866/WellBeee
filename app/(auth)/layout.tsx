import NotificationPoller from "@/app/components/NotificationPoller";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <NotificationPoller />
      <main className="flex-1">{children}</main>
    </div>
  );
}
