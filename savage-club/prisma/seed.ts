import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.savedPost.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("demo1234", 10);

  const coach = await prisma.user.create({
    data: {
      id:         randomUUID(),
      updatedAt:  new Date(),
      username:   "coach.hamond.chic",
      email:      "coach@savageclub.com",
      password,
      bio:        "Coach lifestyle & bien-être 🇬🇦",
      isVerified: true,
      role:       "CREATOR",
    },
  });

  const edith = await prisma.user.create({
    data: {
      id:         randomUUID(),
      updatedAt:  new Date(),
      username:   "edith.brou",
      email:      "edith@savageclub.com",
      password,
      bio:        "Dev Python & frameworks 🐍",
      isVerified: true,
      role:       "TRAINER",
    },
  });

  const user3 = await prisma.user.create({
    data: {
      id:        randomUUID(),
      updatedAt: new Date(),
      username:  "alex.creator",
      email:     "alex@savageclub.com",
      password,
      bio:       "Créateur de contenu 🎬",
      role:      "CREATOR",
    },
  });

  const post1 = await prisma.post.create({
    data: {
      id:        randomUUID(),
      updatedAt: new Date(),
      content:   "Indépendance du Gabon 🇬🇦",
      userId:    coach.id,
      category:  "lifestyle",
      status:    "PUBLISHED",
      PostMedia: {
        create: {
          id:    randomUUID(),
          url:   "https://picsum.photos/seed/gabon/600/400",
          type:  "IMAGE",
          order: 0,
        },
      },
    },
  });

  const post2 = await prisma.post.create({
    data: {
      id:        randomUUID(),
      updatedAt: new Date(),
      content:   "Les frameworks Python 🐍",
      userId:    edith.id,
      category:  "tech",
      status:    "PUBLISHED",
      PostMedia: {
        create: {
          id:    randomUUID(),
          url:   "https://picsum.photos/seed/alliance/600/400",
          type:  "IMAGE",
          order: 0,
        },
      },
    },
  });

  await prisma.like.create({
    data: { id: randomUUID(), userId: edith.id, postId: post1.id },
  });
  await prisma.like.create({
    data: { id: randomUUID(), userId: user3.id, postId: post1.id },
  });
  await prisma.like.create({
    data: { id: randomUUID(), userId: coach.id, postId: post2.id },
  });

  await prisma.comment.create({
    data: {
      id:     randomUUID(),
      text:   "Magnifique ! 🔥",
      userId: edith.id,
      postId: post1.id,
    },
  });

  await prisma.follow.create({
    data: { id: randomUUID(), followerId: edith.id,  followingId: coach.id },
  });
  await prisma.follow.create({
    data: { id: randomUUID(), followerId: user3.id,  followingId: coach.id },
  });
  await prisma.follow.create({
    data: { id: randomUUID(), followerId: coach.id,  followingId: edith.id },
  });

  await prisma.notification.create({
    data: {
      id:         randomUUID(),
      type:       "LIKE",
      receiverId: coach.id,
      senderId:   edith.id,
      postId:     post1.id,
    },
  });

  console.log("✅ Seed terminé !");
  console.log(`   → ${await prisma.user.count()} utilisateurs`);
  console.log(`   → ${await prisma.post.count()} posts`);
  console.log(`   → ${await prisma.like.count()} likes`);
  console.log(`   → ${await prisma.follow.count()} follows`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });