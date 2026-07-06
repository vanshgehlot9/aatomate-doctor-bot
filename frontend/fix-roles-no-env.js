import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://djuqqhdqdnsbitkmdmjr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdXFxaGRxZG5zYml0a21kbWpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzIzMDIwNiwiZXhwIjoyMDk4ODA2MjA2fQ.D0mXJ_x6YOVpGo7ynuwIIKMblvuvbs4KOE0gX2vF58g"
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
