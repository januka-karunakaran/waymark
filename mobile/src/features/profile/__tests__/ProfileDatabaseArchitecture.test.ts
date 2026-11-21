/**
 * Waymark Mobile — Feature 04.4: Profile Database Architecture Test
 * Verifies SQL migration syntax, schema invariants, Row Level Security rules,
 * table constraints, index definitions, and privilege revocations.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Profile Database Architecture (Migration Verification)', () => {
  const migrationPath = path.resolve(
    __dirname,
    '../../../../../supabase/migrations/20261121000000_waymark_user_profile_foundation.sql'
  );

  let migrationSql: string;

  beforeAll(() => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    migrationSql = fs.readFileSync(migrationPath, 'utf-8');
  });

  describe('Table Schema Declarations', () => {
    it('defines public.profiles with cascade deletion from auth.users', () => {
      expect(migrationSql).toMatch(/create table if not exists public\.profiles/i);
      expect(migrationSql).toMatch(/id uuid primary key references auth\.users\(id\) on delete cascade/i);
      expect(migrationSql).toMatch(/display_name varchar\(50\)/i);
      expect(migrationSql).toMatch(/avatar_url varchar\(500\)/i);
      expect(migrationSql).toMatch(/created_at timestamptz/i);
      expect(migrationSql).toMatch(/updated_at timestamptz/i);
    });

    it('defines public.saved_places with foreign key to auth.users and kind check', () => {
      expect(migrationSql).toMatch(/create table if not exists public\.saved_places/i);
      expect(migrationSql).toMatch(/user_id uuid not null references auth\.users\(id\) on delete cascade/i);
      expect(migrationSql).toMatch(/check\s*\(kind in \('home', 'work', 'favorite'\)\)/i);
      expect(migrationSql).toMatch(/label varchar\(50\) not null/i);
      expect(migrationSql).toMatch(/place_text varchar\(120\) not null/i);
    });

    it('defines public.traveler_preferences with distance_unit check constraint', () => {
      expect(migrationSql).toMatch(/create table if not exists public\.traveler_preferences/i);
      expect(migrationSql).toMatch(/user_id uuid primary key references auth\.users\(id\) on delete cascade/i);
      expect(migrationSql).toMatch(/check\s*\(distance_unit in \('km', 'mi'\)\)/i);
      expect(migrationSql).toMatch(/preferred_modes text\[\]/i);
    });

    it('attaches automatic updated_at trigger to all three tables', () => {
      expect(migrationSql).toMatch(/create or replace function public\.handle_updated_at\(\)/i);
      expect(migrationSql).toMatch(/create trigger set_profiles_updated_at/i);
      expect(migrationSql).toMatch(/create trigger set_saved_places_updated_at/i);
      expect(migrationSql).toMatch(/create trigger set_traveler_preferences_updated_at/i);
    });
  });

  describe('Partial Unique Indexes & Performance', () => {
    it('enforces single Home place per user using partial unique index', () => {
      expect(migrationSql).toMatch(
        /create unique index if not exists idx_saved_places_unique_home\s+on public\.saved_places\s*\(user_id\)\s+where\s*\(kind = 'home'\);/i
      );
    });

    it('enforces single Work place per user using partial unique index', () => {
      expect(migrationSql).toMatch(
        /create unique index if not exists idx_saved_places_unique_work\s+on public\.saved_places\s*\(user_id\)\s+where\s*\(kind = 'work'\);/i
      );
    });

    it('indexes saved_places user_id for fast retrieval', () => {
      expect(migrationSql).toMatch(
        /create index if not exists idx_saved_places_user_id\s+on public\.saved_places\s*\(user_id\);/i
      );
    });
  });

  describe('Row Level Security & Privilege Hardening', () => {
    it('enables RLS on profiles, saved_places, and traveler_preferences', () => {
      expect(migrationSql).toMatch(/alter table public\.profiles enable row level security;/i);
      expect(migrationSql).toMatch(/alter table public\.saved_places enable row level security;/i);
      expect(migrationSql).toMatch(/alter table public\.traveler_preferences enable row level security;/i);
    });

    it('revokes broad permissions from public and anon roles', () => {
      expect(migrationSql).toMatch(/revoke all on public\.profiles from public, anon;/i);
      expect(migrationSql).toMatch(/revoke all on public\.saved_places from public, anon;/i);
      expect(migrationSql).toMatch(/revoke all on public\.traveler_preferences from public, anon;/i);
    });

    it('grants CRUD only to authenticated role', () => {
      expect(migrationSql).toMatch(
        /grant select, insert, update, delete on public\.profiles to authenticated;/i
      );
      expect(migrationSql).toMatch(
        /grant select, insert, update, delete on public\.saved_places to authenticated;/i
      );
      expect(migrationSql).toMatch(
        /grant select, insert, update, delete on public\.traveler_preferences to authenticated;/i
      );
    });

    it('enforces strict auth.uid() isolation across all RLS operations', () => {
      // Profiles policies
      expect(migrationSql).toMatch(/create policy "Users can select own profile"[\s\S]+?auth\.uid\(\) = id/i);
      expect(migrationSql).toMatch(/create policy "Users can insert own profile"[\s\S]+?auth\.uid\(\) = id/i);
      expect(migrationSql).toMatch(/create policy "Users can update own profile"[\s\S]+?auth\.uid\(\) = id/i);
      expect(migrationSql).toMatch(/create policy "Users can delete own profile"[\s\S]+?auth\.uid\(\) = id/i);

      // Saved places policies
      expect(migrationSql).toMatch(/create policy "Users can select own saved places"[\s\S]+?auth\.uid\(\) = user_id/i);
      expect(migrationSql).toMatch(/create policy "Users can insert own saved places"[\s\S]+?auth\.uid\(\) = user_id/i);
      expect(migrationSql).toMatch(/create policy "Users can update own saved places"[\s\S]+?auth\.uid\(\) = user_id/i);
      expect(migrationSql).toMatch(/create policy "Users can delete own saved places"[\s\S]+?auth\.uid\(\) = user_id/i);

      // Traveler preferences policies
      expect(migrationSql).toMatch(/create policy "Users can select own preferences"[\s\S]+?auth\.uid\(\) = user_id/i);
      expect(migrationSql).toMatch(/create policy "Users can insert own preferences"[\s\S]+?auth\.uid\(\) = user_id/i);
      expect(migrationSql).toMatch(/create policy "Users can update own preferences"[\s\S]+?auth\.uid\(\) = user_id/i);
      expect(migrationSql).toMatch(/create policy "Users can delete own preferences"[\s\S]+?auth\.uid\(\) = user_id/i);
    });
  });

  describe('Privacy & Data Segregation Safeguards', () => {
    it('does not store sensitive email or password hash in public tables', () => {
      // Must not contain email column or password column in profiles table
      const profilesBlock = migrationSql.match(/create table if not exists public\.profiles\s*\(([\s\S]+?)\);/i)?.[1];
      expect(profilesBlock).toBeDefined();
      expect(profilesBlock).not.toMatch(/\bemail\b/i);
      expect(profilesBlock).not.toMatch(/\bpassword\b/i);
      expect(profilesBlock).not.toMatch(/\bhash\b/i);
    });

    it('does not store health, diagnosis, or disability data in traveler_preferences', () => {
      const prefBlock = migrationSql.match(/create table if not exists public\.traveler_preferences\s*\(([\s\S]+?)\);/i)?.[1];
      expect(prefBlock).toBeDefined();
      expect(prefBlock).not.toMatch(/\bhealth\b/i);
      expect(prefBlock).not.toMatch(/\bdisability\b/i);
      expect(prefBlock).not.toMatch(/\bdiagnosis\b/i);
      expect(prefBlock).not.toMatch(/\bmedical\b/i);
    });
  });
});
