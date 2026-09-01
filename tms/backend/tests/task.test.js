const request = require('supertest');
const app = require('../src/app');
const { User, Team, TeamMember } = require('../src/models');

async function registerAndLogin(role, emailPrefix) {
  const email = `${emailPrefix}@example.com`;
  const password = 'StrongPass123';

  await request(app).post('/api/auth/register').send({ name: emailPrefix, email, password });

  if (role !== 'user') {
    const user = await User.findOne({ where: { email } });
    user.role = role;
    await user.save();
  }

  const login = await request(app).post('/api/auth/login').send({ email, password });
  return { token: login.body.accessToken, user: login.body.user };
}

describe('Tasks & RBAC', () => {
  let admin, manager, user1, user2, team;

  beforeAll(async () => {
    admin = await registerAndLogin('admin', 'admin_task');
    manager = await registerAndLogin('manager', 'manager_task');
    user1 = await registerAndLogin('user', 'user1_task');
    user2 = await registerAndLogin('user', 'user2_task');

    const teamRes = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'QA Team', manager_id: manager.user.id });
    team = teamRes.body.team;

    await request(app)
      .post(`/api/teams/${team.id}/members`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ user_id: user1.user.id });
  });

  it('prevents a regular user from creating a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1.token}`)
      .send({ title: 'Should fail' });
    expect(res.status).toBe(403);
  });

  it('allows a manager to create and assign a task within their team', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${manager.token}`)
      .send({
        title: 'Write test plan',
        priority: 'high',
        team_id: team.id,
        assigned_to: user1.user.id,
        deadline: new Date(Date.now() + 86400000).toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.task.assignee.id).toBe(user1.user.id);
  });

  it("lets the assigned user see the task in their list, but not another user", async () => {
    const listUser1 = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${user1.token}`);
    expect(listUser1.body.tasks.length).toBeGreaterThan(0);

    const listUser2 = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${user2.token}`);
    expect(listUser2.body.tasks.length).toBe(0);
  });

  it('lets the assigned user update only the status of their task', async () => {
    const list = await request(app).get('/api/tasks').set('Authorization', `Bearer ${user1.token}`);
    const task = list.body.tasks[0];

    const res = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${user1.token}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe('in_progress');
  });

  it('rejects a user trying to reassign a task', async () => {
    const list = await request(app).get('/api/tasks').set('Authorization', `Bearer ${user1.token}`);
    const task = list.body.tasks[0];

    const res = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${user1.token}`)
      .send({ assigned_to: user2.user.id });

    expect(res.status).toBe(400);
  });

  it('filters tasks by status and priority', async () => {
    const res = await request(app)
      .get('/api/tasks?status=in_progress&priority=high')
      .set('Authorization', `Bearer ${manager.token}`);

    expect(res.status).toBe(200);
    res.body.tasks.forEach((t) => {
      expect(t.status).toBe('in_progress');
      expect(t.priority).toBe('high');
    });
  });

  it('adds a comment to a task and notifies the assignee/assigner', async () => {
    const list = await request(app).get('/api/tasks').set('Authorization', `Bearer ${manager.token}`);
    const task = list.body.tasks[0];

    const res = await request(app)
      .post(`/api/tasks/${task.id}/comments`)
      .set('Authorization', `Bearer ${manager.token}`)
      .send({ body: 'Please prioritize this by Friday.' });

    expect(res.status).toBe(201);
    expect(res.body.comment.body).toContain('Friday');

    const notifications = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${user1.token}`);
    expect(notifications.body.notifications.some((n) => n.type === 'comment_added')).toBe(true);
  });

  it('returns a dashboard summary scoped to the requester', async () => {
    const res = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${user1.token}`);
    expect(res.status).toBe(200);
    expect(res.body.statusCounts).toBeDefined();
  });
});
