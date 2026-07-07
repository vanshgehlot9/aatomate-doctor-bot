-- Migration: Multi-Role Support for Users
-- Run this on your Supabase SQL Editor BEFORE deploying code changes.

-- Step 1: Add new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_role TEXT;

-- Step 2: Migrate existing single-role data into new columns
UPDATE users
SET
  roles = jsonb_build_array(role),
  active_role = role
WHERE role IS NOT NULL
  AND (roles IS NULL OR roles = '[]'::jsonb);

-- Step 3: Create an index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_users_active_role ON users(active_role);
CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN(roles);

-- NOTE: We intentionally keep the old `role` column for backward compatibility.
-- It can be dropped in a future migration once all code paths use `roles`/`active_role`.
