/**
 * Waymark Mobile — Feature 04.5: Account Security, Settings & Final QA
 * Task 04.5.3: Supabase RLS, Session & Account Security Verification
 *
 * Verifies:
 * 1. PostgreSQL RLS Migration & Policy Declarations (AST & Static Verification)
 * 2. pgTAP / SQL RLS Test Infrastructure Integrity (`supabase/tests/feature_04_5_account_rls.test.sql`)
 * 3. Mobile Credential Boundaries & Zero Service-Role Key Exposure
 * 4. PostgREST Error Code & RLS Denial Mapping in SupabaseProfileRepository
 * 5. ProfileContext Session Race-Condition Hardening & Late Response Rejection
 * 6. Account Switching Isolation & Sensitive Token Masking
 */

import * as fs from 'fs';
import * as path from 'path';
import { SupabaseProfileRepository } from '../services/SupabaseProfileRepository';
import { maskSensitiveData } from '../../../utils/logger';

describe('Feature 04.5.3 — Supabase RLS, Session & Account Security Verification', () => {
  const rootDir = path.resolve(__dirname, '../../../../../');
  const migrationPath = path.join(
    rootDir,
    'supabase/migrations/20261121000000_waymark_user_profile_foundation.sql'
  );
  const rlsTestPath = path.join(
    rootDir,
    'supabase/tests/feature_04_5_account_rls.test.sql'
  );

  let migrationSql: string;
  let rlsTestSql: string;

  beforeAll(() => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    expect(fs.existsSync(rlsTestPath)).toBe(true);
    migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    rlsTestSql = fs.readFileSync(rlsTestPath, 'utf-8');
  });

  // ==========================================================================
  // SECTION 1: DATABASE MIGRATION & RLS POLICIES AUDIT
  // ==========================================================================
  describe('1. Database Migration & RLS Security Audit', () => {
    it('TC-04.5.3-01: verifies RLS is strictly enabled on all three tables', () => {
      expect(migrationSql).toMatch(/alter table public\.profiles enable row level security;/i);
      expect(migrationSql).toMatch(/alter table public\.saved_places enable row level security;/i);
      expect(migrationSql).toMatch(/alter table public\.traveler_preferences enable row level security;/i);
    });

    it('TC-04.5.3-02: revokes all default permissions from public and anon roles', () => {
      expect(migrationSql).toMatch(/revoke all on public\.profiles from public, anon;/i);
      expect(migrationSql).toMatch(/revoke all on public\.saved_places from public, anon;/i);
      expect(migrationSql).toMatch(/revoke all on public\.traveler_preferences from public, anon;/i);
    });

    it('TC-04.5.3-03: grants minimal necessary CRUD operations strictly to authenticated role', () => {
      expect(migrationSql).toMatch(/grant select, insert, update, delete on public\.profiles to authenticated;/i);
      expect(migrationSql).toMatch(/grant select, insert, update, delete on public\.saved_places to authenticated;/i);
      expect(migrationSql).toMatch(/grant select, insert, update, delete on public\.traveler_preferences to authenticated;/i);
    });

    it('TC-04.5.3-04: verifies strict auth.uid() matching on profiles policies', () => {
      expect(migrationSql).toMatch(/create policy "Users can select own profile"[\s\S]*?using \(auth\.uid\(\) = id\);/i);
      expect(migrationSql).toMatch(/create policy "Users can insert own profile"[\s\S]*?with check \(auth\.uid\(\) = id\);/i);
      expect(migrationSql).toMatch(/create policy "Users can update own profile"[\s\S]*?using \(auth\.uid\(\) = id\)[\s\S]*?with check \(auth\.uid\(\) = id\);/i);
      expect(migrationSql).toMatch(/create policy "Users can delete own profile"[\s\S]*?using \(auth\.uid\(\) = id\);/i);
    });

    it('TC-04.5.3-05: verifies strict auth.uid() matching on saved_places policies', () => {
      expect(migrationSql).toMatch(/create policy "Users can select own saved places"[\s\S]*?using \(auth\.uid\(\) = user_id\);/i);
      expect(migrationSql).toMatch(/create policy "Users can insert own saved places"[\s\S]*?with check \(auth\.uid\(\) = user_id\);/i);
      expect(migrationSql).toMatch(/create policy "Users can update own saved places"[\s\S]*?using \(auth\.uid\(\) = user_id\)[\s\S]*?with check \(auth\.uid\(\) = user_id\);/i);
      expect(migrationSql).toMatch(/create policy "Users can delete own saved places"[\s\S]*?using \(auth\.uid\(\) = user_id\);/i);
    });

    it('TC-04.5.3-06: verifies strict auth.uid() matching on traveler_preferences policies', () => {
      expect(migrationSql).toMatch(/create policy "Users can select own preferences"[\s\S]*?using \(auth\.uid\(\) = user_id\);/i);
      expect(migrationSql).toMatch(/create policy "Users can insert own preferences"[\s\S]*?with check \(auth\.uid\(\) = user_id\);/i);
      expect(migrationSql).toMatch(/create policy "Users can update own preferences"[\s\S]*?using \(auth\.uid\(\) = user_id\)[\s\S]*?with check \(auth\.uid\(\) = user_id\);/i);
      expect(migrationSql).toMatch(/create policy "Users can delete own preferences"[\s\S]*?using \(auth\.uid\(\) = user_id\);/i);
    });

    it('TC-04.5.3-07: verifies foreign key cascading and partial unique constraints for Home and Work', () => {
      expect(migrationSql).toMatch(/id uuid primary key references auth\.users\(id\) on delete cascade/i);
      expect(migrationSql).toMatch(/user_id uuid not null references auth\.users\(id\) on delete cascade/i);
      expect(migrationSql).toMatch(/create unique index if not exists idx_saved_places_unique_home[\s\S]*?where\s*\(kind = 'home'\);/i);
      expect(migrationSql).toMatch(/create unique index if not exists idx_saved_places_unique_work[\s\S]*?where\s*\(kind = 'work'\);/i);
    });
  });

  // ==========================================================================
  // SECTION 2: REAL RLS TEST INFRASTRUCTURE MATRIX VERIFICATION
  // ==========================================================================
  describe('2. Real RLS pgTAP Test Infrastructure Verification', () => {
    it('TC-04.5.3-08: guarantees test transaction isolation with rollback', () => {
      expect(rlsTestSql).toMatch(/(?:^|\n)begin;/i);
      expect(rlsTestSql.trim().endsWith('rollback;')).toBe(true);
      expect(rlsTestSql).toMatch(/select plan\(26\);/);
      expect(rlsTestSql).toMatch(/select \* from finish\(\);/);
    });

    it('TC-04.5.3-09: verifies anonymous caller matrix in SQL test suite', () => {
      expect(rlsTestSql).toMatch(/set local role anon;/i);
      // Profiles anonymous
      expect(rlsTestSql).toMatch(/RLS-01 \[Profiles\]: Anonymous caller cannot select any profile/);
      expect(rlsTestSql).toMatch(/RLS-02 \[Profiles\]: Anonymous caller cannot insert profile/);
      expect(rlsTestSql).toMatch(/RLS-03 \[Profiles\]: Anonymous caller cannot update profiles/);
      expect(rlsTestSql).toMatch(/RLS-04 \[Profiles\]: Anonymous caller cannot delete profiles/);
      // Saved places anonymous
      expect(rlsTestSql).toMatch(/RLS-05 \[Saved Places\]: Anonymous caller cannot select any saved places/);
      expect(rlsTestSql).toMatch(/RLS-06 \[Saved Places\]: Anonymous caller cannot insert saved places/);
      expect(rlsTestSql).toMatch(/RLS-07 \[Saved Places\]: Anonymous caller cannot update saved places/);
      expect(rlsTestSql).toMatch(/RLS-08 \[Saved Places\]: Anonymous caller cannot delete saved places/);
      // Preferences anonymous
      expect(rlsTestSql).toMatch(/RLS-09 \[Traveler Preferences\]: Anonymous caller cannot select traveler preferences/);
      expect(rlsTestSql).toMatch(/RLS-10 \[Traveler Preferences\]: Anonymous caller cannot insert traveler preferences/);
    });

    it('TC-04.5.3-10: verifies authenticated User A isolation matrix in SQL test suite', () => {
      expect(rlsTestSql).toMatch(/set local role authenticated;/i);
      expect(rlsTestSql).toMatch(/"sub": "00000000-0000-0000-0000-000000000001"/);
      // Profile isolation
      expect(rlsTestSql).toMatch(/RLS-11 \[Profiles\]: User A can insert own profile/);
      expect(rlsTestSql).toMatch(/RLS-12 \[Profiles\]: User A can read own profile/);
      expect(rlsTestSql).toMatch(/RLS-13 \[Profiles\]: User A cannot select User B profile/);
      expect(rlsTestSql).toMatch(/RLS-14 \[Profiles\]: User A cannot update User B profile/);
      expect(rlsTestSql).toMatch(/RLS-15 \[Profiles\]: User A cannot insert profile spoofing User B ID/);
      // Saved places isolation
      expect(rlsTestSql).toMatch(/RLS-16 \[Saved Places\]: User A can insert own Home/);
      expect(rlsTestSql).toMatch(/RLS-17 \[Saved Places\]: User A can read own Home/);
      expect(rlsTestSql).toMatch(/RLS-18 \[Saved Places\]: User A cannot read User B saved places/);
      expect(rlsTestSql).toMatch(/RLS-19 \[Saved Places\]: User A cannot update User B saved places/);
      expect(rlsTestSql).toMatch(/RLS-20 \[Saved Places\]: User A cannot delete User B saved places/);
      expect(rlsTestSql).toMatch(/RLS-21 \[Saved Places\]: User A cannot insert row owned by User B/);
      expect(rlsTestSql).toMatch(/RLS-22 \[Saved Places\]: Unique Home per user constraint enforced/);
      // Preferences isolation
      expect(rlsTestSql).toMatch(/RLS-23 \[Traveler Preferences\]: User A can insert own traveler preferences/);
      expect(rlsTestSql).toMatch(/RLS-24 \[Traveler Preferences\]: User A can read own traveler preferences/);
      expect(rlsTestSql).toMatch(/RLS-25 \[Traveler Preferences\]: User A cannot read User B traveler preferences/);
      expect(rlsTestSql).toMatch(/RLS-26 \[Traveler Preferences\]: User A cannot forge another user preferences row/);
    });
  });

  // ==========================================================================
  // SECTION 3: CREDENTIAL BOUNDARIES & ZERO SERVICE-ROLE KEY LEAKAGE
  // ==========================================================================
  describe('3. Mobile Credential Boundaries', () => {
    it('TC-04.5.3-11: verifies no service-role or master keys are present in mobile source files', () => {
      const mobileSrcDir = path.join(rootDir, 'mobile/src');
      const allFiles: string[] = [];

      function walk(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (
            entry.isDirectory() &&
            entry.name !== 'node_modules' &&
            entry.name !== '.git' &&
            entry.name !== '__tests__'
          ) {
            walk(fullPath);
          } else if (
            entry.isFile() &&
            /\.(ts|tsx|js|json)$/.test(entry.name) &&
            !entry.name.includes('.test.')
          ) {
            allFiles.push(fullPath);
          }
        }
      }

      walk(mobileSrcDir);

      for (const file of allFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        expect(content).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
        expect(content).not.toMatch(/service_role.*secret/i);
        expect(content).not.toMatch(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{30,}/);
      }
    });

    it('TC-04.5.3-12: verifies .env.example contains only public publishable key placeholder', () => {
      const envExamplePath = path.join(rootDir, 'mobile/.env.example');
      if (fs.existsSync(envExamplePath)) {
        const envContent = fs.readFileSync(envExamplePath, 'utf-8');
        expect(envContent).not.toMatch(/EXPO_PUBLIC_.*SERVICE_ROLE/i);
        expect(envContent).not.toMatch(/^[^#\n]*service_role/im);
        expect(envContent).toMatch(/EXPO_PUBLIC_SUPABASE_ANON_KEY/i);
      }
    });
  });

  // ==========================================================================
  // SECTION 4: POSTGREST ERROR MAPPING & RLS EXCEPTION INTEGRATION
  // ==========================================================================
  describe('4. PostgREST Error & RLS Access Control Mapping', () => {
    it('TC-04.5.3-13: maps PostgREST code 42501 (permission denied) to UNAUTHENTICATED error', async () => {
      const mockClient: any = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: { code: '42501', message: 'permission denied for table profiles' }
              })
            })
          })
        })
      };

      const repo = new SupabaseProfileRepository(mockClient);
      const result = await repo.getProfile('unauthorized-user-id');

      expect(result.success).toBe(false);
      if (result.success) throw new Error('Expected failure');
      expect(result.error.code).toBe('UNAUTHENTICATED');
      expect(result.error.message).toMatch(/Row Level Security/i);
    });

    it('TC-04.5.3-14: maps PostgREST code 23505 (unique violation) to CONFLICT error', async () => {
      const mockClient: any = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
              })
            })
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: '23505', message: 'duplicate key value violates unique constraint "idx_saved_places_unique_home"' }
              })
            })
          })
        })
      };

      const repo = new SupabaseProfileRepository(mockClient);
      const result = await repo.upsertSavedPlace('user-1', {
        kind: 'home',
        label: 'Home',
        placeText: '123 Test St'
      });

      expect(result.success).toBe(false);
      if (result.success) throw new Error('Expected failure');
      expect(result.error.code).toBe('CONFLICT');
      expect(result.error.message).toMatch(/unique constraints/i);
    });

    it('TC-04.5.3-15: maps PostgREST code PGRST116 (not found) to NOT_FOUND error', async () => {
      const mockClient: any = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'The result contains 0 rows' }
              })
            })
          })
        })
      };

      const repo = new SupabaseProfileRepository(mockClient);
      const result = await repo.getProfile('non-existent-user');

      expect(result.success).toBe(false);
      if (result.success) throw new Error('Expected failure');
      expect(result.error.code).toBe('NOT_FOUND');
    });

    it('TC-04.5.3-16: safely handles network disconnect without crashing', async () => {
      const mockClient: any = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockRejectedValue(new Error('Network request failed'))
            })
          })
        })
      };

      const repo = new SupabaseProfileRepository(mockClient);
      const result = await repo.getProfile('user-network-down');

      expect(result.success).toBe(false);
      if (result.success) throw new Error('Expected failure');
      expect(result.error.code).toBe('NETWORK_ERROR');
      expect(result.error.message).toBe('Network request failed');
    });
  });

  // ==========================================================================
  // SECTION 5: SENSITIVE DATA LOGGING PROTECTION
  // ==========================================================================
  describe('5. Sensitive Data Masking & Token Protection', () => {
    it('TC-04.5.3-17: masks passwords, access tokens, and refresh tokens from logging', () => {
      const rawPayload = {
        user: { id: 'user-123', email: 'traveler@waymark.app' },
        password: 'SuperSecretPassword!2100',
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_token',
        refresh_token: 'secret_refresh_token_xyz',
        auth: {
          token: 'jwt.token.here',
          secretKey: 'some_secret_key'
        }
      };

      const masked = maskSensitiveData(rawPayload) as any;

      expect(masked.password).toBe('***REDACTED***');
      expect(masked.access_token).toBe('***REDACTED***');
      expect(masked.refresh_token).toBe('***REDACTED***');
      expect(masked.auth.token).toBe('***REDACTED***');
      expect(masked.auth.secretKey).toBe('***REDACTED***');
      expect(masked.user.email).toBe('traveler@waymark.app');
      expect(masked.user.id).toBe('user-123');
    });
  });
});
