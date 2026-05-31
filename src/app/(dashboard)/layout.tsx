import { DashboardNav } from "@/components/layout/DashboardNav";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="dashboard-scroll">
      <DashboardNav user={session.user} />
      <main>{children}</main>
    </div>
  );
}
