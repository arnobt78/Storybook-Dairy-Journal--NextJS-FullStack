import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingCover } from "@/components/journal/BookCover";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  return <LandingCover />;
}
