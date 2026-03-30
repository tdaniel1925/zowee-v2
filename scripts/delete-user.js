const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function deleteUser() {
  const identifier = process.argv[2]; // Can be email or phone

  if (!identifier) {
    console.log('Usage: node scripts/delete-user.js <email-or-phone>');
    console.log('\nListing all users:\n');

    // List all users from database
    const { data: users, error } = await supabase
      .from('jordyn_users')
      .select('id, auth_user_id, name, phone_number, plan, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users from database:', error);
    }

    // List all users from Auth
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
    }

    console.log('\n=== DATABASE USERS (jordyn_users) ===');
    if (!users || users.length === 0) {
      console.log('No users found in database.');
    } else {
      console.log('ID                                    | Auth User ID                          | Name              | Phone          | Plan        ');
      console.log('─'.repeat(140));
      users.forEach(u => {
        console.log(`${u.id} | ${u.auth_user_id || 'N/A'.padEnd(36)} | ${(u.name || '').padEnd(17)} | ${(u.phone_number || '').padEnd(14)} | ${(u.plan || '').padEnd(11)}`);
      });
    }

    console.log('\n=== AUTH USERS (supabase.auth.users) ===');
    if (!authData || !authData.users || authData.users.length === 0) {
      console.log('No users found in Auth.');
    } else {
      console.log('Auth User ID                          | Email                         | Phone          | Created');
      console.log('─'.repeat(140));
      authData.users.forEach(u => {
        console.log(`${u.id} | ${(u.email || 'N/A').padEnd(29)} | ${(u.phone || 'N/A').padEnd(14)} | ${u.created_at}`);
      });
    }

    console.log('\nTo delete a user, run: node scripts/delete-user.js <email-or-phone>');
    process.exit(0);
  }

  console.log(`\nSearching for user: ${identifier}\n`);

  // Try to find by email in Auth first
  const { data: authData } = await supabase.auth.admin.listUsers();
  const authUser = authData?.users?.find(u => u.email === identifier || u.phone === identifier);

  let user = null;
  let authUserId = null;

  if (authUser) {
    console.log('Found in Auth:');
    console.log('  Auth User ID:', authUser.id);
    console.log('  Email:', authUser.email);
    console.log('  Phone:', authUser.phone);
    authUserId = authUser.id;

    // Try to find corresponding database user
    const { data: dbUser } = await supabase
      .from('jordyn_users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single();

    if (dbUser) {
      user = dbUser;
      console.log('\nFound in Database:');
      console.log('  ID:', user.id);
      console.log('  Name:', user.name);
      console.log('  Phone:', user.phone_number);
      console.log('  Plan:', user.plan);
    }
  } else {
    // Try to find by phone in database
    const { data: dbUser } = await supabase
      .from('jordyn_users')
      .select('*')
      .eq('phone_number', identifier.startsWith('+1') ? identifier : `+1${identifier}`)
      .single();

    if (dbUser) {
      user = dbUser;
      authUserId = user.auth_user_id;
      console.log('Found in Database:');
      console.log('  ID:', user.id);
      console.log('  Name:', user.name);
      console.log('  Phone:', user.phone_number);
      console.log('  Plan:', user.plan);
      console.log('  Auth User ID:', user.auth_user_id);
    }
  }

  if (!user && !authUserId) {
    console.error('User not found with identifier:', identifier);
    process.exit(1);
  }

  // Delete from jordyn_users table (if exists)
  if (user) {
    console.log('\n1. Deleting from jordyn_users table...');
    const { error: deleteError } = await supabase
      .from('jordyn_users')
      .delete()
      .eq('id', user.id);

    if (deleteError) {
      console.error('Error deleting from jordyn_users:', deleteError);
    } else {
      console.log('✓ Deleted from jordyn_users');
    }
  } else {
    console.log('\n1. No database record found (only Auth user exists)');
  }

  // Delete from Supabase Auth
  if (authUserId) {
    console.log('\n2. Deleting from Supabase Auth...');
    const { error: authError } = await supabase.auth.admin.deleteUser(authUserId);

    if (authError) {
      console.error('Error deleting from Auth:', authError);
      process.exit(1);
    } else {
      console.log('✓ Deleted from Supabase Auth');
    }
  } else {
    console.log('\n2. No Auth user found');
  }

  console.log('\n✓ User successfully deleted!');
}

deleteUser().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
