import { getServerSession, authOptions } from "@/lib/auth-compat";
// app/parametres/page.tsx


import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ParametresClient from "@/components/parametres/ParametresClient";

export default async function ParametresPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      avatar: true,
      bio: true,
      role: true,
      isVerified: true,
      idVerified: true,
      idDocumentUrl: true,
      category: true,
      location: true,
      website: true,
      subscriptionPrice: true,
      subscriptionVIP: true,
      audioCallPrice: true,
      videoCallPrice: true,
      messagePrice: true,
      createdAt: true,
    },
  });

  if (!user) redirect("/auth");

  return (
    <div className="flex min-h-screen bg-[#3B0764]">
      <Sidebar />
      <ParametresClient user={user} />
    </div>
  );
}
