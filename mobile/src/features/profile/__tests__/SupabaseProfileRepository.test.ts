/**
 * Waymark Mobile — Feature 04.4: SupabaseProfileRepository Unit Tests
 * Verifies repository CRUD, validation guardrails, and error mapping.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseProfileRepository } from '../services/SupabaseProfileRepository';

describe('SupabaseProfileRepository', () => {
  let mockClient: { from: jest.Mock };
  let repository: SupabaseProfileRepository;

  beforeEach(() => {
    mockClient = {
      from: jest.fn()
    };
    repository = new SupabaseProfileRepository(mockClient as unknown as SupabaseClient);
  });

  describe('Unconfigured Client Guard', () => {
    it('returns UNAUTHENTICATED error when Supabase client is null', async () => {
      const unconfiguredRepo = new SupabaseProfileRepository(null);
      const res = await unconfiguredRepo.getProfile('user-123');

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('UNAUTHENTICATED');
        expect(res.error.message).toContain('not configured');
      }
    });
  });

  describe('getProfile', () => {
    it('returns user profile successfully when row exists', async () => {
      const mockRow = {
        id: 'user-123',
        display_name: 'Janu Karunakaran',
        avatar_url: 'https://images.waymark.app/avatar.png',
        created_at: '2026-11-21T00:00:00Z',
        updated_at: '2026-11-21T01:00:00Z'
      };

      const maybeSingleMock = jest.fn().mockResolvedValue({ data: mockRow, error: null });
      const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockClient.from.mockReturnValue({ select: selectMock });

      const res = await repository.getProfile('user-123');

      expect(mockClient.from).toHaveBeenCalledWith('profiles');
      expect(selectMock).toHaveBeenCalledWith('id, display_name, avatar_url, created_at, updated_at');
      expect(eqMock).toHaveBeenCalledWith('id', 'user-123');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toEqual({
          id: 'user-123',
          displayName: 'Janu Karunakaran',
          avatarUrl: 'https://images.waymark.app/avatar.png',
          createdAt: '2026-11-21T00:00:00Z',
          updatedAt: '2026-11-21T01:00:00Z'
        });
      }
    });

    it('returns null data when no row exists', async () => {
      const maybeSingleMock = jest.fn().mockResolvedValue({ data: null, error: null });
      const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockClient.from.mockReturnValue({ select: selectMock });

      const res = await repository.getProfile('user-404');

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBeNull();
      }
    });

    it('maps RLS permission denied error to UNAUTHENTICATED', async () => {
      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { code: '42501', message: 'permission denied for table profiles' }
      });
      const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockClient.from.mockReturnValue({ select: selectMock });

      const res = await repository.getProfile('user-unauth');

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('UNAUTHENTICATED');
      }
    });
  });

  describe('upsertProfile', () => {
    it('rejects invalid display name before making network call', async () => {
      const res = await repository.upsertProfile('user-123', {
        displayName: 'A'.repeat(51) // Exceeds 50 chars
      });

      expect(mockClient.from).not.toHaveBeenCalled();
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('rejects invalid avatar URL before making network call', async () => {
      const res = await repository.upsertProfile('user-123', {
        avatarUrl: 'javascript:alert(1)'
      });

      expect(mockClient.from).not.toHaveBeenCalled();
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('upserts sanitized inputs and returns mapped UserProfile', async () => {
      const mockReturnedRow = {
        id: 'user-123',
        display_name: 'Janu Updated',
        avatar_url: 'https://example.com/avatar.png',
        created_at: '2026-11-21T00:00:00Z',
        updated_at: '2026-11-21T02:00:00Z'
      };

      const singleMock = jest.fn().mockResolvedValue({ data: mockReturnedRow, error: null });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const upsertMock = jest.fn().mockReturnValue({ select: selectMock });
      mockClient.from.mockReturnValue({ upsert: upsertMock });

      const res = await repository.upsertProfile('user-123', {
        displayName: '  Janu Updated  ',
        avatarUrl: 'https://example.com/avatar.png'
      });

      expect(mockClient.from).toHaveBeenCalledWith('profiles');
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          display_name: 'Janu Updated',
          avatar_url: 'https://example.com/avatar.png'
        })
      );
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.displayName).toBe('Janu Updated');
      }
    });
  });

  describe('Saved Places CRUD', () => {
    it('retrieves saved places ordered by created_at', async () => {
      const mockRows = [
        {
          id: 'place-1',
          user_id: 'user-123',
          kind: 'home',
          label: 'Home',
          place_text: '123 Galle Rd',
          created_at: '2026-11-21T00:00:00Z',
          updated_at: '2026-11-21T00:00:00Z'
        }
      ];

      const orderMock = jest.fn().mockResolvedValue({ data: mockRows, error: null });
      const eqMock = jest.fn().mockReturnValue({ order: orderMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockClient.from.mockReturnValue({ select: selectMock });

      const res = await repository.getSavedPlaces('user-123');

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.length).toBe(1);
        expect(res.data[0].placeText).toBe('123 Galle Rd');
      }
    });

    it('deletes saved place matching placeId and userId', async () => {
      const eqUserMock = jest.fn().mockResolvedValue({ error: null });
      const eqIdMock = jest.fn().mockReturnValue({ eq: eqUserMock });
      const deleteMock = jest.fn().mockReturnValue({ eq: eqIdMock });
      mockClient.from.mockReturnValue({ delete: deleteMock });

      const res = await repository.deleteSavedPlace('user-123', 'place-1');

      expect(res.success).toBe(true);
      expect(deleteMock).toHaveBeenCalled();
      expect(eqIdMock).toHaveBeenCalledWith('id', 'place-1');
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-123');
    });
  });

  describe('Preferences', () => {
    it('returns default preferences if none exist', async () => {
      const maybeSingleMock = jest.fn().mockResolvedValue({ data: null, error: null });
      const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockClient.from.mockReturnValue({ select: selectMock });

      const res = await repository.getPreferences('user-123');

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.preferredModes).toEqual([]);
        expect(res.data.distanceUnit).toBe('km');
      }
    });
  });
});
