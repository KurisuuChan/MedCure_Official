console.log("🧪 Basic test - checking if we can see the data structure");

// Let's just create a sample data structure to see what should be there
const sampleProduct = {
  id: "123",
  generic_name: "DIACYSTEINE",
  brand_name: "DIACYSTEINE",
  category: "Mucolytic/Expectorant",
  manufacturer: "Sample Pharma",
  dosage_form: "Tablet",
  dosage_strength: "200mg",
  drug_classification: "OTC",
  supplier: "Sample Supplier",
  batch_number: "BT011225-001",
  stock_in_pieces: 0,
  reorder_level: 10,
  price_per_piece: 15.0,
  cost_price: 10.0,
  expiry_date: "2025-12-31",
  is_active: true,
  is_archived: false,
};

console.log("📋 Sample product structure:");
console.log(JSON.stringify(sampleProduct, null, 2));

// Test our data extraction logic
const medName =
  sampleProduct.brand_name && sampleProduct.brand_name.trim()
    ? sampleProduct.brand_name
    : sampleProduct.generic_name && sampleProduct.generic_name.trim()
    ? sampleProduct.generic_name
    : "Unknown Medication";

const manufacturer =
  sampleProduct.manufacturer && sampleProduct.manufacturer.trim()
    ? sampleProduct.manufacturer
    : "Not Specified";

const dosage =
  sampleProduct.dosage_strength && sampleProduct.dosage_strength.trim()
    ? sampleProduct.dosage_strength
    : "Not Specified";

console.log("\n✅ Extracted data:");
console.log(`Name: ${medName}`);
console.log(`Manufacturer: ${manufacturer}`);
console.log(`Dosage: ${dosage}`);
console.log(`Stock: ${sampleProduct.stock_in_pieces} pcs`);
console.log(`Reorder Level: ${sampleProduct.reorder_level} pcs`);

// Test if this would be low stock
const isLowStock = sampleProduct.stock_in_pieces <= sampleProduct.reorder_level;
console.log(`\n⚠️ Is Low Stock: ${isLowStock}`);

console.log("\n🔍 This shows the expected data structure for medications");
console.log(
  "If your PDF shows 'N/A' values, it means these fields are empty in your database"
);
