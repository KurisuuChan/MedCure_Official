-- ============================================================================
-- QUICK FIFO PRICE CHECK
-- ============================================================================
-- Run this to see if your prices match oldest batches

-- Check products vs their oldest batch prices
SELECT 
  COALESCE(p.generic_name, p.brand_name, 'Unknown') as "Product",
  p.price_per_piece as "Current Price",
  (
    SELECT selling_price 
    FROM product_batches 
    WHERE product_id = p.id 
      AND quantity > 0 
      AND status = 'active'
    ORDER BY created_at ASC 
    LIMIT 1
  ) as "Oldest Batch Price",
  (
    SELECT batch_number
    FROM product_batches 
    WHERE product_id = p.id 
      AND quantity > 0 
      AND status = 'active'
    ORDER BY created_at ASC 
    LIMIT 1
  ) as "Oldest Batch",
  CASE
    WHEN p.price_per_piece = (
      SELECT selling_price 
      FROM product_batches 
      WHERE product_id = p.id 
        AND quantity > 0 
        AND status = 'active'
      ORDER BY created_at ASC 
      LIMIT 1
    ) THEN '✅ MATCH'
    ELSE '❌ MISMATCH - RUN REFRESH!'
  END as "Status"
FROM products p
WHERE EXISTS (
  SELECT 1 FROM product_batches pb 
  WHERE pb.product_id = p.id 
    AND pb.quantity > 0 
    AND pb.status = 'active'
)
ORDER BY COALESCE(p.generic_name, p.brand_name)
LIMIT 20;
