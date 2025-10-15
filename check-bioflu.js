// Quick script to check if Bioflu exists in the database
// Run with: node check-bioflu.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ccffpklqscpzqculffnd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjZmZwa2xxc2NwenFjdWxmZm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMTYxMjAsImV4cCI6MjA3Mjc5MjEyMH0.Ngqvdx1pR-Y8inZVgj-uHMBi3c9ZFUlsz_Fc3kDqyN4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBioflu() {
  console.log('🔍 Checking for Bioflu in the database...\n');

  // Check by brand name
  const { data: byBrand, error: brandError } = await supabase
    .from('products')
    .select('*')
    .ilike('brand_name', '%bioflu%');

  if (brandError) {
    console.error('❌ Error searching by brand:', brandError);
  } else {
    console.log(`📦 Found ${byBrand?.length || 0} products with "Bioflu" in brand name:`);
    if (byBrand && byBrand.length > 0) {
      byBrand.forEach(product => {
        console.log(`  ✓ ID: ${product.id}`);
        console.log(`    Name: ${product.generic_name}`);
        console.log(`    Brand: ${product.brand_name}`);
        console.log(`    Strength: ${product.dosage_strength}`);
        console.log(`    Category: ${product.category}`);
        console.log(`    Active: ${product.is_active}`);
        console.log(`    Archived: ${product.is_archived}`);
        console.log('');
      });
    } else {
      console.log('  ❌ No Bioflu products found\n');
    }
  }

  // Check by generic name (combination drug)
  const { data: byGeneric, error: genericError } = await supabase
    .from('products')
    .select('*')
    .or('generic_name.ilike.%paracetamol%phenylephrine%,generic_name.ilike.%phenylephrine%paracetamol%');

  if (genericError) {
    console.error('❌ Error searching by generic:', genericError);
  } else {
    console.log(`📦 Found ${byGeneric?.length || 0} products with Paracetamol+Phenylephrine combination:`);
    if (byGeneric && byGeneric.length > 0) {
      byGeneric.forEach(product => {
        console.log(`  ✓ ID: ${product.id}`);
        console.log(`    Name: ${product.generic_name}`);
        console.log(`    Brand: ${product.brand_name}`);
        console.log(`    Strength: ${product.dosage_strength}`);
        console.log('');
      });
    }
  }

  // Get total product count
  const { count, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('is_archived', false);

  if (!countError) {
    console.log(`\n📊 Total active products in database: ${count}`);
  }

  // Get recent imports
  const { data: recentProducts, error: recentError } = await supabase
    .from('products')
    .select('generic_name, brand_name, created_at')
    .order('created_at', { ascending: false })
    .limit(15);

  if (!recentError && recentProducts) {
    console.log('\n🕐 Last 15 products added:');
    recentProducts.forEach((product, idx) => {
      console.log(`  ${idx + 1}. ${product.brand_name} - ${product.generic_name} (${new Date(product.created_at).toLocaleString()})`);
    });
  }
}

checkBioflu()
  .then(() => {
    console.log('\n✅ Database check complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

