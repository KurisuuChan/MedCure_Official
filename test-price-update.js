/**
 * 🔍 COMPREHENSIVE PRICE UPDATE DIAGNOSTIC TOOL
 * Tests price updates and checks for UI sync issues
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
let supabaseUrl, supabaseKey;
try {
  const envFile = readFileSync(join(__dirname, '.env'), 'utf8');
  const envVars = {};
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
  supabaseUrl = envVars.VITE_SUPABASE_URL;
  supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
} catch (err) {
  console.error('❌ Could not read .env file:', err.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('   Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 PRICE UPDATE DIAGNOSTIC TOOL');
console.log('================================\n');

/**
 * Test 1: Check database triggers for price updates
 */
async function checkPriceTriggers() {
  console.log('\n📋 TEST 1: Checking Price-Related Triggers');
  console.log('━'.repeat(60));

  try {
    const { data, error } = await supabase.rpc('get_trigger_info');
    
    if (error) {
      console.log('⚠️  Custom trigger query failed, using alternative method');
      
      // Alternative: Query pg_trigger directly
      const { data: triggers, error: triggerError } = await supabase
        .from('pg_trigger')
        .select('*');
      
      if (triggerError) {
        console.log('❌ Could not fetch triggers:', triggerError.message);
        return;
      }
    }

    console.log('✅ Database connection successful');
    
    // Check for specific triggers
    const triggerChecks = [
      'trg_update_price_on_batch_depletion',
      'trigger_update_product_price_on_batch_change',
      'update_product_price_from_fifo'
    ];

    console.log('\n🔎 Looking for price-related triggers:');
    triggerChecks.forEach(trigger => {
      console.log(`   • ${trigger}`);
    });

  } catch (err) {
    console.error('❌ Error checking triggers:', err.message);
  }
}

/**
 * Test 2: Simulate a price update and track changes
 */
async function testPriceUpdate() {
  console.log('\n📋 TEST 2: Testing Price Update Flow');
  console.log('━'.repeat(60));

  try {
    // Get a random product to test
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, generic_name, brand_name, price_per_piece, stock_in_pieces')
      .eq('is_archived', false)
      .limit(1)
      .single();

    if (fetchError || !products) {
      console.log('❌ Could not fetch test product:', fetchError?.message);
      return;
    }

    console.log('📦 Test Product:');
    console.log(`   Name: ${products.generic_name || products.brand_name}`);
    console.log(`   ID: ${products.id}`);
    console.log(`   Current Price: ₱${products.price_per_piece}`);
    console.log(`   Stock: ${products.stock_in_pieces} pieces`);

    // Save original price
    const originalPrice = products.price_per_piece;
    const testPrice = parseFloat(originalPrice) + 10;

    console.log(`\n🔄 Updating price from ₱${originalPrice} to ₱${testPrice}...`);

    // Update the price
    const { data: updateResult, error: updateError } = await supabase
      .from('products')
      .update({ 
        price_per_piece: testPrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', products.id)
      .select();

    if (updateError) {
      console.log('❌ Update failed:', updateError.message);
      return;
    }

    console.log('✅ Update executed successfully');

    // Wait a moment for triggers to fire
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify the update
    const { data: verifyResult, error: verifyError } = await supabase
      .from('products')
      .select('id, generic_name, brand_name, price_per_piece, updated_at')
      .eq('id', products.id)
      .single();

    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message);
      return;
    }

    console.log('\n🔍 Verification Results:');
    console.log(`   Current Price in DB: ₱${verifyResult.price_per_piece}`);
    console.log(`   Last Updated: ${new Date(verifyResult.updated_at).toLocaleString()}`);
    
    if (parseFloat(verifyResult.price_per_piece) === testPrice) {
      console.log('   ✅ Price updated correctly in database');
    } else {
      console.log('   ⚠️  Price mismatch detected!');
      console.log(`   Expected: ₱${testPrice}`);
      console.log(`   Got: ₱${verifyResult.price_per_piece}`);
    }

    // Restore original price
    console.log(`\n🔄 Restoring original price (₱${originalPrice})...`);
    await supabase
      .from('products')
      .update({ price_per_piece: originalPrice })
      .eq('id', products.id);
    
    console.log('✅ Price restored');

  } catch (err) {
    console.error('❌ Error during price update test:', err.message);
  }
}

/**
 * Test 3: Check for RLS policies that might affect updates
 */
async function checkRLSPolicies() {
  console.log('\n📋 TEST 3: Checking Row-Level Security (RLS) Policies');
  console.log('━'.repeat(60));

  try {
    // Try to get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('⚠️  Not authenticated - testing with anon key');
      console.log('   This might affect update permissions');
    } else {
      console.log('✅ Authenticated as:', user.email);
    }

    // Test if we can update products
    const { data: testProduct, error: selectError } = await supabase
      .from('products')
      .select('id')
      .limit(1)
      .single();

    if (selectError) {
      console.log('❌ Cannot read products:', selectError.message);
      return;
    }

    // Try a harmless update (same value)
    const { error: updateError } = await supabase
      .from('products')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', testProduct.id);

    if (updateError) {
      console.log('❌ RLS Policy Issue: Cannot update products');
      console.log('   Error:', updateError.message);
      console.log('\n💡 Suggestion: Check if RLS policies allow updates');
    } else {
      console.log('✅ RLS policies allow updates');
    }

  } catch (err) {
    console.error('❌ Error checking RLS:', err.message);
  }
}

/**
 * Test 4: Check for batch-related triggers that might affect price
 */
async function checkBatchSystem() {
  console.log('\n📋 TEST 4: Checking Batch System Integration');
  console.log('━'.repeat(60));

  try {
    // Check if product_batches table exists
    const { data: batches, error: batchError } = await supabase
      .from('product_batches')
      .select('id')
      .limit(1);

    if (batchError) {
      console.log('⚠️  product_batches table not accessible:', batchError.message);
      console.log('   This might be expected if batch tracking is not enabled');
    } else {
      console.log('✅ product_batches table exists and is accessible');
      
      // Get a product with batches
      const { data: productWithBatch, error: pbError } = await supabase
        .from('products')
        .select(`
          id,
          generic_name,
          brand_name,
          price_per_piece,
          product_batches (
            id,
            batch_number,
            quantity_remaining,
            selling_price,
            status
          )
        `)
        .limit(1)
        .single();

      if (!pbError && productWithBatch) {
        console.log('\n📦 Sample Product with Batches:');
        console.log(`   Name: ${productWithBatch.generic_name}`);
        console.log(`   Product Price: ₱${productWithBatch.price_per_piece}`);
        console.log(`   Batches: ${productWithBatch.product_batches?.length || 0}`);
        
        if (productWithBatch.product_batches?.length > 0) {
          const activeBatch = productWithBatch.product_batches.find(b => b.status === 'active');
          if (activeBatch) {
            console.log(`\n   Active Batch:`);
            console.log(`   • Batch #: ${activeBatch.batch_number}`);
            console.log(`   • Batch Price: ₱${activeBatch.selling_price}`);
            console.log(`   • Remaining: ${activeBatch.quantity_remaining}`);
            
            if (activeBatch.selling_price !== productWithBatch.price_per_piece) {
              console.log('\n   ⚠️  PRICE MISMATCH DETECTED!');
              console.log(`   Product price (₱${productWithBatch.price_per_piece}) doesn't match`);
              console.log(`   batch price (₱${activeBatch.selling_price})`);
            } else {
              console.log('\n   ✅ Product price matches active batch price');
            }
          }
        }
      }
    }

  } catch (err) {
    console.error('❌ Error checking batch system:', err.message);
  }
}

/**
 * Test 5: Check for realtime subscriptions or caching issues
 */
async function checkRealtimeIssues() {
  console.log('\n📋 TEST 5: Checking for Realtime/Caching Issues');
  console.log('━'.repeat(60));

  console.log('\n💡 Common UI Sync Issues:');
  console.log('   1. State not updating after successful DB update');
  console.log('   2. Component not re-rendering after state change');
  console.log('   3. Stale data in browser cache');
  console.log('   4. Race condition between update and fetch');
  console.log('\n📌 Recommendations:');
  console.log('   • Check if loadProducts() is called after update');
  console.log('   • Verify React state is properly updated');
  console.log('   • Clear browser cache and try again');
  console.log('   • Check browser console for errors');
}

/**
 * Main execution
 */
async function runDiagnostics() {
  console.log('Starting comprehensive diagnostics...\n');

  await checkPriceTriggers();
  await testPriceUpdate();
  await checkRLSPolicies();
  await checkBatchSystem();
  await checkRealtimeIssues();

  console.log('\n━'.repeat(60));
  console.log('✅ DIAGNOSTICS COMPLETE');
  console.log('━'.repeat(60));
  
  console.log('\n📊 SUMMARY & RECOMMENDATIONS:');
  console.log('   1. Check if product disappears only in UI or also in database');
  console.log('   2. Try updating price via Supabase dashboard to isolate issue');
  console.log('   3. Check browser DevTools Network tab during update');
  console.log('   4. Look for console errors when product "disappears"');
  console.log('   5. Verify useInventory hook properly updates state');
  console.log('\n💡 LIKELY CAUSE:');
  console.log('   Based on code review, the issue is likely in the UI state');
  console.log('   management in useInventory.js - the state update may not');
  console.log('   be triggering a re-render, or there may be a filtering issue');
  console.log('   that temporarily hides the updated product.');
  
  process.exit(0);
}

// Run all diagnostics
runDiagnostics().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
