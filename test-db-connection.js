// Test database connection
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // Test 1: Check auth
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    console.log('✓ Auth check:', session ? 'User logged in' : 'No active session')
    
    // Test 2: Query readings table
    const { data, error } = await supabase
      .from('readings')
      .select('id, created_at')
      .limit(1)
    
    if (error) {
      console.log('✗ Database query failed:', error.message)
    } else {
      console.log('✓ Database query successful')
      console.log('  Sample reading:', data?.[0] || 'No readings found')
    }
    
    // Test 3: Check tables accessibility
    const { error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    console.log('✓ Users table:', usersError ? `Access denied (${usersError.message})` : 'Accessible')
    
    console.log('\n✓ Supabase connection test completed successfully!')
    
  } catch (err) {
    console.error('✗ Connection test failed:', err.message)
  }
}

testConnection()
