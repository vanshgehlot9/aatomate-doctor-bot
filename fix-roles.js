require('dotenv').config({ path: './frontend/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixRoles() {
  console.log("Fixing user roles...");
  const { data, error } = await supabase
    .from('users')
    .update({ role: 'hospital_admin' })
    .eq('role', 'admin')
    .select();

  if (error) {
    console.error("Error updating roles:", error);
  } else {
    console.log(`Successfully updated ${data.length} users to 'hospital_admin' role.`);
  }
}

fixRoles();
