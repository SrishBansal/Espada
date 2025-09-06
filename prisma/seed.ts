import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.message.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const hashedPassword = await hash('password123', 10);
  
  const users = await prisma.$transaction([
    prisma.user.create({
      data: {
        email: 'alice@example.com',
        name: 'Alice Johnson',
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob@example.com',
        name: 'Bob Smith',
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        email: 'charlie@example.com',
        name: 'Charlie Brown',
        password: hashedPassword,
      },
    }),
  ]);

  const [alice, bob, charlie] = users;

  // Create projects
  const projects = await prisma.$transaction([
    prisma.project.create({
      data: {
        name: 'Website Redesign',
        description: 'Redesign the company website with modern UI/UX',
        ownerId: alice.id,
        members: {
          connect: [{ id: alice.id }, { id: bob.id }],
        },
      },
    }),
    prisma.project.create({
      data: {
        name: 'Mobile App Development',
        description: 'Build a cross-platform mobile app',
        ownerId: bob.id,
        members: {
          connect: [{ id: bob.id }, { id: charlie.id }, { id: alice.id }],
        },
      },
    }),
  ]);

  const [websiteProject, appProject] = projects;

  // Create tasks
  const tasks = await prisma.$transaction([
    // Website Redesign tasks
    prisma.task.create({
      data: {
        title: 'Design homepage',
        description: 'Create wireframes and design for the homepage',
        status: 'TODO',
        projectId: websiteProject.id,
        createdById: alice.id,
        assigneeId: alice.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Implement responsive navigation',
        description: 'Make sure the navigation works on mobile and desktop',
        status: 'IN_PROGRESS',
        projectId: websiteProject.id,
        createdById: alice.id,
        assigneeId: bob.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Optimize images',
        description: 'Compress and optimize all images for web',
        status: 'TODO',
        projectId: websiteProject.id,
        createdById: bob.id,
      },
    }),
    // Mobile App tasks
    prisma.task.create({
      data: {
        title: 'Set up React Native project',
        description: 'Initialize the React Native project with TypeScript',
        status: 'DONE',
        projectId: appProject.id,
        createdById: bob.id,
        assigneeId: charlie.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Design app icon',
        description: 'Create a modern and recognizable app icon',
        status: 'IN_PROGRESS',
        projectId: appProject.id,
        createdById: charlie.id,
        assigneeId: alice.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Implement user authentication',
        description: 'Set up JWT authentication flow',
        status: 'TODO',
        projectId: appProject.id,
        createdById: bob.id,
        assigneeId: bob.id,
      },
    }),
  ]);

  // Create messages
  const messages = await prisma.$transaction([
    // Website project messages
    prisma.message.create({
      data: {
        content: 'I\'ve started working on the homepage design. What do you think about the color scheme?',
        projectId: websiteProject.id,
        senderId: alice.id,
      },
    }),
    prisma.message.create({
      data: {
        content: 'The color scheme looks great! I think we should also consider adding more white space.',
        projectId: websiteProject.id,
        senderId: bob.id,
      },
    }),
    // App project messages
    prisma.message.create({
      data: {
        content: 'I\'ve set up the React Native project with TypeScript. Ready for development!',
        projectId: appProject.id,
        senderId: charlie.id,
      },
    }),
    prisma.message.create({
      data: {
        content: 'Awesome! I\'ll start working on the authentication flow next.',
        projectId: appProject.id,
        senderId: bob.id,
      },
    }),
  ]);

  console.log('✅ Database seeded successfully');
  console.log(`👥 ${users.length} users created`);
  console.log(`📂 ${projects.length} projects created`);
  console.log(`📝 ${tasks.length} tasks created`);
  console.log(`💬 ${messages.length} messages created`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
