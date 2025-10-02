const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://hcxhpldalsvjftgezvfu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjeGhwbGRhbHN2amZ0Z2V6dmZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDczMjQsImV4cCI6MjA3NDgyMzMyNH0.qUKqfTBvYiSU-PI88k4ipJ78uIjfuLC4-VCcWi9Vv78' // Copia tu anon key de Settings → API
)

async function test() {
  try {
    const { data, error } = await supabase.from('productos').select('*').limit(1)
    
    if (error) {
      console.error('❌ Error:', error.message)
    } else {
      console.log('✅ Conexión exitosa con Supabase!')
      console.log('Productos:', data)
    }
  } catch (err) {
    console.error('❌ Error general:', err.message)
  }
}

test()