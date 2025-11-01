// Quick script to check current database schema
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jdclnpgxzomybndxjqrm.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY not found')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('🔍 Checking database schema...\n')

  // Check products table structure
  console.log('📦 PRODUCTS TABLE:')
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('*')
    .limit(1)
  
  if (products && products.length > 0) {
    console.log('Columns:', Object.keys(products[0]))
    console.log('Sample:', products[0])
  }
  console.log('\n')

  // Check product_batches table structure
  console.log('📦 PRODUCT_BATCHES TABLE:')
  const { data: batches, error: batchError } = await supabase
    .from('product_batches')
    .select('*')
    .limit(1)
  
  if (batches && batches.length > 0) {
    console.log('Columns:', Object.keys(batches[0]))
    console.log('Sample:', batches[0])
  } else if (batchError) {
    console.error('Error:', batchError)
  }
  console.log('\n')

  // Check sales table structure
  console.log('💰 SALES TABLE:')
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('*')
    .limit(1)
  
  if (sales && sales.length > 0) {
    console.log('Columns:', Object.keys(sales[0]))
  }
  console.log('\n')

  // Check sale_items table structure
  console.log('💰 SALE_ITEMS TABLE:')
  const { data: saleItems, error: itemsError } = await supabase
    .from('sale_items')
    .select('*')
    .limit(1)
  
  if (saleItems && saleItems.length > 0) {
    console.log('Columns:', Object.keys(saleItems[0]))
  }
  console.log('\n')

  // Check for existing stored procedures
  console.log('🔧 Checking stored procedures...')
  const { data: procs, error: procError } = await supabase
    .rpc('get_all_batches')
    .limit(1)
  
  console.log('get_all_batches exists:', !procError)
  
  console.log('\n✅ Schema check complete!')
}

checkSchema().catch(console.error)
