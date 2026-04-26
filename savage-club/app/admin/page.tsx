// app/admin/page.tsx
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-compat";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";


export default async function AdminPage() {
  const session = await getServerSession();
  if (!session?.user?.email) redirect("/auth");
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (currentUser?.role !== "ADMIN") redirect("/");

  // Créateurs/formateurs en attente de vérification
  const pendingUsers = await prisma.user.findMany({
    where: {
      role:       { in: ["CREATOR", "TRAINER"] },
      isVerified: false,
      idDocumentUrl: { not: null },
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      role: true,
      avatar: true,
      idDocumentUrl: true,
      selfieUrl: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Créateurs/formateurs déjà vérifiés
  const verifiedUsers = await prisma.user.findMany({
    where: {
      role:       { in: ["CREATOR", "TRAINER"] },
      isVerified: true,
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Stats
  const stats = {
    totalUsers:    await prisma.user.count(),
    totalCreators: await prisma.user.count({ where: { role: { in: ["CREATOR", "TRAINER"] } } }),
    verified:      await prisma.user.count({ where: { isVerified: true } }),
    pending:       pendingUsers.length,
    totalPosts:    await prisma.post.count({ where: { status: "PUBLISHED" } }),
  };

  return <AdminClient pendingUsers={pendingUsers} verifiedUsers={verifiedUsers} stats={stats} />;
}
