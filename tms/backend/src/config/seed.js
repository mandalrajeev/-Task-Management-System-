// Seeds a first admin account plus a small demo dataset. Safe to re-run;
// it skips creation of records that already exist.
// Usage: npm run seed
require('dotenv').config();
const { sequelize, User, Team, TeamMember, Task } = require('../models');

async function upsertUser(data) {
  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) return existing;
  return User.create(data);
}

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const admin = await upsertUser({
      name: 'Ada Admin',
      email: 'admin@example.com',
      password_hash: 'Password123!',
      role: 'admin'
    });

    const manager = await upsertUser({
      name: 'Mia Manager',
      email: 'manager@example.com',
      password_hash: 'Password123!',
      role: 'manager'
    });

    const user1 = await upsertUser({
      name: 'Uma User',
      email: 'user1@example.com',
      password_hash: 'Password123!',
      role: 'user'
    });

    const user2 = await upsertUser({
      name: 'Leo Learner',
      email: 'user2@example.com',
      password_hash: 'Password123!',
      role: 'user'
    });

    let team = await Team.findOne({ where: { name: 'Engineering' } });
    if (!team) {
      team = await Team.create({
        name: 'Engineering',
        description: 'Builds and maintains the product',
        created_by: admin.id,
        manager_id: manager.id
      });
    }

    await TeamMember.findOrCreate({ where: { team_id: team.id, user_id: user1.id } });
    await TeamMember.findOrCreate({ where: { team_id: team.id, user_id: user2.id } });

    const existingTasks = await Task.count({ where: { team_id: team.id } });
    if (existingTasks === 0) {
      await Task.bulkCreate([
        {
          title: 'Set up CI pipeline',
          description: 'Configure GitHub Actions for lint, test, and build',
          status: 'in_progress',
          priority: 'high',
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          team_id: team.id,
          assigned_to: user1.id,
          assigned_by: manager.id
        },
        {
          title: 'Write API documentation',
          description: 'Document all REST endpoints with Swagger',
          status: 'todo',
          priority: 'medium',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          team_id: team.id,
          assigned_to: user2.id,
          assigned_by: manager.id
        },
        {
          title: 'Fix login page responsiveness',
          description: 'Ensure the login form works well on mobile widths',
          status: 'done',
          priority: 'low',
          deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          team_id: team.id,
          assigned_to: user1.id,
          assigned_by: manager.id
        }
      ]);
    }

    console.log('Seed complete.');
    console.log('Admin login:   admin@example.com / Password123!');
    console.log('Manager login: manager@example.com / Password123!');
    console.log('User logins:   user1@example.com / user2@example.com / Password123!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
})();
