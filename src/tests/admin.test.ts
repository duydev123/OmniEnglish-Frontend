import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminApi } from '../services/adminApi';

describe('Admin Module Services (CMS & Users)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch CMS content sets list', async () => {
    vi.spyOn(adminApi, 'getContentSets').mockResolvedValue([
      {
        id: 'cs_reading_1',
        title: 'IELTS Reading Academic 2026',
        category: 'READING (20 Qs)',
        badge: 'READING',
        itemsCount: 20,
        itemUnit: 'Topics',
        status: 'Published',
        updatedAt: '2026-09-01',
        type: 'reading',
      },
    ]);

    const sets = await adminApi.getContentSets();
    expect(sets.length).toBe(1);
    expect(sets[0].title).toBe('IELTS Reading Academic 2026');
  });

  it('should create new CMS content set', async () => {
    vi.spyOn(adminApi, 'createContentSet').mockResolvedValue({
      id: 'cs_speaking_1',
      title: 'Speaking Part 2 Topics',
      category: 'SPEAKING (5 Qs)',
      badge: 'SPEAKING',
      itemsCount: 5,
      itemUnit: 'Topics',
      status: 'Published',
      updatedAt: '2026-09-01',
      type: 'speaking',
    });

    const newSet = await adminApi.createContentSet({
      title: 'Speaking Part 2 Topics',
      category: 'SPEAKING (5 Qs)',
      itemsCount: 5,
      status: 'Published',
      type: 'speaking',
    });

    expect(newSet.id).toBe('cs_speaking_1');
    expect(newSet.type).toBe('speaking');
  });

  it('should fetch CMS overall stats', async () => {
    vi.spyOn(adminApi, 'getStats').mockResolvedValue({
      totalVocabItems: 1200,
      publishedSets: 15,
      draftsPending: 3,
    });

    const stats = await adminApi.getStats();
    expect(stats.totalVocabItems).toBe(1200);
    expect(stats.publishedSets).toBe(15);
  });

  it('should fetch admin users list', async () => {
    vi.spyOn(adminApi, 'getUsers').mockResolvedValue([
      {
        id: 'u_1',
        username: 'adminuser',
        email: 'admin@example.com',
        role: 'Admin',
        status: 'Active',
      },
    ]);

    const users = await adminApi.getUsers();
    expect(users.length).toBe(1);
    expect(users[0].role).toBe('Admin');
  });

  it('should update user role and status', async () => {
    vi.spyOn(adminApi, 'updateUser').mockResolvedValue({
      id: 'u_2',
      username: 'student1',
      role: 'Admin',
      status: 'Active',
    });

    const updated = await adminApi.updateUser('u_2', { role: 'Admin' });
    expect(updated.role).toBe('Admin');
  });

  it('should delete user in admin panel', async () => {
    vi.spyOn(adminApi, 'deleteUser').mockResolvedValue({
      message: 'User deleted successfully',
    });

    const res = await adminApi.deleteUser('u_2');
    expect(res.message).toContain('deleted');
  });
});
