/**
 * Migration Script: Convert single-role users to multi-role format.
 *
 * This script:
 *  1. Reads all users from the `users` table.
 *  2. Converts `role` (string) → `roles` (array) + `active_role`.
 *  3. Updates the `users` table.
 *  4. Updates Supabase Auth `user_metadata` to include `roles` and `activeRole`.
 *
 * Usage:
 *   node migrate-to-multi-role.js
 *
 * Prerequisites:
 *   - Run `migrations/001_multi_role_support.sql` on Supabase first.
 *   - Set SUPABASE_SERVICE_ROLE_KEY in frontend/.env.local
 */

require('dotenv').config({ path: './frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in frontend/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
  console.log('🔄 Starting multi-role migration...\n');

  // 1. Fetch all users
  const { data: users, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error('❌ Failed to fetch users:', error);
    process.exit(1);
  }

  console.log(`Found ${users.length} users to migrate.\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const user of users) {
    const uid = user.id;
    const existingRole = user.role;
    const existingRoles = user.roles;

    // Skip if already migrated
    if (existingRoles && Array.isArray(existingRoles) && existingRoles.length > 0) {
      console.log(`⏭  Skipping ${user.email} — already has roles: [${existingRoles.join(', ')}]`);
      skipCount++;
      continue;
    }

    if (!existingRole) {
      console.log(`⚠️  Skipping ${user.email} — no role set`);
      skipCount++;
      continue;
    }

    const rolesArray = [existingRole];
    const activeRole = existingRole;

    try {
      // 2. Update users table
      const { error: dbError } = await supabase
        .from('users')
        .update({
          roles: rolesArray,
          active_role: activeRole,
        })
        .eq('id', uid);

      if (dbError) {
        console.error(`❌ DB update failed for ${user.email}:`, dbError.message);
        errorCount++;
        continue;
      }

      // 3. Update Supabase Auth user_metadata
      try {
        await supabase.auth.admin.updateUserById(uid, {
          user_metadata: {
            roles: rolesArray,
            activeRole: activeRole,
            // Keep legacy fields for backward compat
            role: existingRole,
            tenantId: user.tenant_id,
            tenant_id: user.tenant_id,
            name: user.name,
          },
        });
      } catch (authError) {
        console.error(`⚠️  Auth metadata update failed for ${user.email}:`, authError.message);
        // Don't fail — DB is already updated
      }

      console.log(`✅ Migrated ${user.email}: role="${existingRole}" → roles=[${rolesArray.join(', ')}], active_role="${activeRole}"`);
      successCount++;
    } catch (err) {
      console.error(`❌ Failed for ${user.email}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n──────────────────────────────────────');
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭  Skipped: ${skipCount}`);
  console.log(`❌ Errors:  ${errorCount}`);
  console.log('──────────────────────────────────────');
  console.log('\n🎉 Migration complete!');
}

migrate();
