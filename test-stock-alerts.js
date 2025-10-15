// Simple test to check stock alerts data
import { supabase } from "./src/config/supabase.js";

async function testStockAlerts() {
  console.log("🧪 Testing stock alerts data...");

  try {
    // Test the same query as the reports service
    const { data: products, error } = await supabase
      .from("products")
      .select(
        `
        id,
        generic_name,
        brand_name,
        category,
        manufacturer,
        dosage_form,
        dosage_strength,
        drug_classification,
        supplier,
        batch_number,
        stock_in_pieces,
        reorder_level,
        price_per_piece,
        cost_price,
        expiry_date,
        is_active,
        is_archived
      `
      )
      .eq("is_active", true)
      .eq("is_archived", false)
      .limit(5);

    if (error) {
      console.error("❌ Error:", error);
      return;
    }

    console.log("✅ Products found:", products?.length || 0);

    if (products && products.length > 0) {
      console.log("\n📋 Sample product data:");
      products.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.generic_name || "N/A"}`);
        console.log(`   Brand: ${product.brand_name || "N/A"}`);
        console.log(`   Category: ${product.category || "N/A"}`);
        console.log(`   Manufacturer: ${product.manufacturer || "N/A"}`);
        console.log(`   Dosage: ${product.dosage_strength || "N/A"}`);
        console.log(`   Supplier: ${product.supplier || "N/A"}`);
        console.log(`   Batch: ${product.batch_number || "N/A"}`);
        console.log(`   Stock: ${product.stock_in_pieces || 0}`);
        console.log(`   Reorder Level: ${product.reorder_level || 10}`);
      });

      // Check for low stock items
      const lowStock = products.filter(
        (p) => (p.stock_in_pieces || 0) <= (p.reorder_level || 10)
      );

      console.log(`\n⚠️ Low stock items: ${lowStock.length}`);
      lowStock.forEach((item) => {
        console.log(
          `   - ${item.generic_name}: ${item.stock_in_pieces} pcs (need ${item.reorder_level})`
        );
      });

      // Check for missing data
      console.log("\n🔍 Data completeness check:");
      products.forEach((product, index) => {
        const missing = [];
        if (!product.manufacturer) missing.push("manufacturer");
        if (!product.dosage_strength) missing.push("dosage_strength");
        if (!product.supplier) missing.push("supplier");
        if (!product.batch_number) missing.push("batch_number");

        if (missing.length > 0) {
          console.log(
            `   ${index + 1}. ${product.generic_name} - Missing: ${missing.join(
              ", "
            )}`
          );
        }
      });
    }
  } catch (error) {
    console.error("❌ Test error:", error);
  }
}

// Run the test
testStockAlerts();
