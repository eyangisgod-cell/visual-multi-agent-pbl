/**
 * Backend API Tests
 *
 * Tests for FastAPI backend endpoints
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Test data helpers
const testUser = {
  id: 'test-user-id',
  email: 'api-test@example.com',
  username: 'api_test_user',
  passwordHash: bcrypt.hashSync('password123', 10),
};

describe('Auth API', () => {
  beforeAll(async () => {
    // Create test user
    await prisma.user.upsert({
      where: { email: testUser.email },
      update: {},
      create: {
        id: testUser.id,
        email: testUser.email,
        username: testUser.username,
        password: testUser.passwordHash,
      },
    });
  });

  afterAll(async () => {
    // Cleanup test user
    await prisma.user.delete({
      where: { email: testUser.email },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should create new user', async () => {
      const timestamp = Date.now();
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `new_user_${timestamp}`,
          email: `new_user_${timestamp}@example.com`,
          password: 'password123',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toContain('new_user_');
    });

    it('should reject duplicate email', async () => {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'duplicate_user',
          email: testUser.email,
          password: 'password123',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject invalid email format', async () => {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'invalid_user',
          email: 'not-an-email',
          password: 'password123',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate with valid credentials', async () => {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'password123',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'wrongpassword',
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeAll(async () => {
      // Get auth token
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'password123',
        }),
      });
      const data = await response.json();
      authToken = data.token;
    });

    it('should return current user with valid token', async () => {
      const response = await fetch('http://localhost:3000/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user.email).toBe(testUser.email);
    });

    it('should reject request without token', async () => {
      const response = await fetch('http://localhost:3000/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await fetch('http://localhost:3000/api/auth/me', {
        headers: { Authorization: 'Bearer invalid-token' },
      });

      expect(response.status).toBe(401);
    });
  });
});

describe('Agents API', () => {
  let authToken: string;

  beforeAll(async () => {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: 'password123',
      }),
    });
    const data = await response.json();
    authToken = data.token;
  });

  describe('GET /api/admin/agents/list', () => {
    it('should return list of all agents', async () => {
      const response = await fetch('http://localhost:3000/api/admin/agents/list', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.agents).toBeInstanceOf(Array);
      expect(data.agents.length).toBeGreaterThan(0);
    });

    it('should include agent details', async () => {
      const response = await fetch('http://localhost:3000/api/admin/agents/list', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json();
      const agent = data.agents[0];

      expect(agent.id).toBeDefined();
      expect(agent.name).toBeDefined();
      expect(agent.role).toBeDefined();
      expect(agent.avatarUrl).toBeDefined();
    });

    it('should reject unauthenticated request', async () => {
      const response = await fetch('http://localhost:3000/api/admin/agents/list');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/admin/agents/select', () => {
    it('should select an agent', async () => {
      const response = await fetch('http://localhost:3000/api/admin/agents/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ agentId: 'mentor' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.selected).toBe(true);
    });

    it('should reject invalid agent ID', async () => {
      const response = await fetch('http://localhost:3000/api/admin/agents/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ agentId: 'invalid-agent' }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/agents/select', () => {
    it('should return currently selected agent', async () => {
      // First select an agent
      await fetch('http://localhost:3000/api/admin/agents/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ agentId: 'mentor' }),
      });

      // Then query selection
      const response = await fetch('http://localhost:3000/api/admin/agents/select', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.selectedAgent).toBeDefined();
    });
  });

  describe('GET /api/admin/agents/presets', () => {
    it('should return agent presets', async () => {
      const response = await fetch('http://localhost:3000/api/admin/agents/presets', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.presets).toBeInstanceOf(Array);
      expect(data.presets.length).toBe(5); // 5 agent types
    });
  });
});

describe('Projects API', () => {
  let authToken: string;
  let projectId: string;

  beforeAll(async () => {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: 'password123',
      }),
    });
    const data = await response.json();
    authToken = data.token;
  });

  describe('POST /api/projects', () => {
    it('should create new project', async () => {
      const response = await fetch('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Test Project',
          description: 'Test Description',
          gradeMin: 1,
          gradeMax: 5,
          subject: 'Math',
          difficulty: 2,
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.project).toBeDefined();
      expect(data.project.title).toBe('Test Project');
      projectId = data.project.id;
    });

    it('should reject invalid project data', async () => {
      const response = await fetch('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: '', // Empty title
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/projects', () => {
    it('should return list of projects', async () => {
      const response = await fetch('http://localhost:3000/api/projects', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.projects).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return project by ID', async () => {
      // Create project first
      const createResponse = await fetch('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Test Project 2',
          description: 'Test Description',
          gradeMin: 1,
          gradeMax: 5,
          subject: 'Math',
          difficulty: 2,
        }),
      });
      const createData = await createResponse.json();
      const newProjectId = createData.project.id;

      const response = await fetch(`http://localhost:3000/api/projects/${newProjectId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.project.id).toBe(newProjectId);

      // Cleanup
      await fetch(`http://localhost:3000/api/projects/${newProjectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
    });

    it('should return 404 for non-existent project', async () => {
      const response = await fetch('http://localhost:3000/api/projects/non-existent', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete project', async () => {
      // Create project first
      const createResponse = await fetch('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'To Delete',
          description: 'Test',
          gradeMin: 1,
          gradeMax: 5,
          subject: 'Math',
          difficulty: 1,
        }),
      });
      const createData = await createResponse.json();
      const newProjectId = createData.project.id;

      const response = await fetch(`http://localhost:3000/api/projects/${newProjectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
    });
  });
});

describe('Memories API', () => {
  let authToken: string;

  beforeAll(async () => {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: 'password123',
      }),
    });
    const data = await response.json();
    authToken = data.token;
  });

  describe('POST /api/memories', () => {
    it('should create new memory', async () => {
      const response = await fetch('http://localhost:3000/api/memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          agentId: 'mentor',
          type: 'SHORT_TERM',
          content: 'Test memory content',
          importance: 5,
          tags: ['test'],
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.memory).toBeDefined();
    });
  });

  describe('POST /api/memories/query', () => {
    it('should query memories by vector similarity', async () => {
      const response = await fetch('http://localhost:3000/api/memories/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          query: 'test memory',
          topK: 5,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.memories).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/memories/consolidate', () => {
    it('should consolidate short-term memories', async () => {
      const response = await fetch('http://localhost:3000/api/memories/consolidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ agentId: 'mentor' }),
      });

      expect(response.status).toBe(200);
    });
  });
});
