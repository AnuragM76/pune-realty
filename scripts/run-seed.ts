import { seedDatabase } from '../src/lib/seed';

seedDatabase()
  .then(() => {
    console.log('Seeding script finished successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding script error:', err);
    process.exit(1);
  });
