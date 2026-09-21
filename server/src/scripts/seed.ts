import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

dotenv.config({ path: '../../.env' });

// Import models (adjust paths if necessary)
import { User } from '../modules/users/User.js';
import { Post } from '../modules/posts/Post.js';
import { Comment } from '../modules/comments/Comment.js';
import { RefreshToken } from '../modules/auth/RefreshToken.js';

const SALT_ROUNDS = 12;

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Seed script cannot be run in production environment.');
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shipyard';
  await mongoose.connect(mongoUri);

  // Drop the whole database for a clean start (safe for demo environments)
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  console.log('Database cleared');

  // ---------- Users ----------
  const adminPassword = 'Password123';
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    passwordHash: await bcrypt.hash(adminPassword, SALT_ROUNDS),
    role: 'admin',
    isEmailVerified: true,
    createdAt: new Date(),
  });

  const regularUsers = [];
  for (let i = 1; i <= 10; i++) {
    const user = await User.create({
      name: `User ${i}`,
      email: `user${i}@example.com`,
      passwordHash: await bcrypt.hash('Password123', SALT_ROUNDS),
      role: 'user',
      isEmailVerified: true,
      createdAt: new Date(),
    });
    regularUsers.push(user);
  }

  // ---------- Posts & Votes ----------
  const categories = ['UI/UX', 'Integrations', 'Performance', 'General'];
  const statuses = ['under_review', 'planned', 'in_progress', 'completed'] as const;

  const posts = [];
  for (let i = 1; i <= 30; i++) {
    const author = [admin, ...regularUsers][Math.floor(Math.random() * (regularUsers.length + 1))];
    const possibleVoters = [admin, ...regularUsers];
    const voterCount = Math.floor(Math.random() * 5) + 1; // 1‑5 voters per post
    const shuffled = possibleVoters.sort(() => 0.5 - Math.random());
    const voters = shuffled.slice(0, voterCount);

    const post = await Post.create({
      title: `Demo Post ${i}`,
      description: `This is a **demo** post number ${i}.`,
      category: categories[Math.floor(Math.random() * categories.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      author: author._id,
      voters: voters.map((u) => u._id),
      voteCount: voters.length,
      commentCount: 0,
      statusHistory: [],
    });
    posts.push(post);
  }
  // ---------- Sample Feature Requests ----------
  const samplePosts = [
    {
      title: 'Dark Mode Support',
      description: 'Add a dark mode toggle to improve usability for night-time users.',
      category: 'UI/UX',
    },
    {
      title: 'Slack Integration',
      description: 'Notify a Slack channel when a new feature request is submitted.',
      category: 'Integrations',
    },
    {
      title: 'Search Performance',
      description: 'Optimize database queries for faster search.',
      category: 'Performance',
    },
    {
      title: 'Export to CSV',
      description: 'Allow admins to export feature requests as CSV.',
      category: 'General',
    },
    {
      title: 'Custom Tags',
      description: 'Enable users to tag requests for better organization.',
      category: 'UI/UX',
    },
  ];

  for (const sp of samplePosts) {
    await Post.create({
      title: sp.title,
      description: sp.description,
      category: sp.category as any,
      status: 'under_review',
      author: admin._id,
      voters: [],
      voteCount: 0,
      commentCount: 0,
      statusHistory: [],
    });
    console.log(`Created sample post: ${sp.title}`);
  }

  // ---------- Threaded Comments (depth 0‑2) ----------
  for (const post of posts) {
    const topCount = Math.floor(Math.random() * 3); // 0‑2 top‑level comments
    const topComments = [];
    for (let i = 0; i < topCount; i++) {
      const author = [admin, ...regularUsers][Math.floor(Math.random() * (regularUsers.length + 1))];
      const comment = await Comment.create({
        post: post._id,
        author: author._id,
        body: `Top comment ${i + 1} on ${post.title}`,
        parent: null,
        root: null,
        depth: 0,
        isDeleted: false,
        createdAt: new Date(),
      });
      topComments.push(comment);
    }
    // One reply per top‑level comment
    for (const parent of topComments) {
      const author = [admin, ...regularUsers][Math.floor(Math.random() * (regularUsers.length + 1))];
      await Comment.create({
        post: post._id,
        author: author._id,
        body: `Reply to comment ${parent._id}`,
        parent: parent._id,
        root: parent._id,
        depth: 1,
        isDeleted: false,
        createdAt: new Date(),
      });
    }
    // Update commentCount on the post (each thread adds two comments)
    await Post.findByIdAndUpdate(post._id, { commentCount: topComments.length * 2 });
  }

  // ---------- Output demo credentials ----------
  console.log('\n=== Demo credentials ===');
  console.log('Admin email: admin@example.com');
  console.log('Admin password: Password123');
  console.log('User email pattern: user<number>@example.com');
  console.log('User password: Password123');

  await mongoose.disconnect();
  console.log('Seeding complete');
}

main().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
