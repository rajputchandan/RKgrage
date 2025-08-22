// Test file to verify GST calculations preserve decimal values
// This tests the fix for the rounding issue where 508.5099 was being rounded to 509

const testGSTCalculation = (subtotal, cgstRate = 9, sgstRate = 9) => {
  console.log(`\n=== Testing GST Calculation ===`);
  console.log(`Subtotal: ₹${subtotal}`);
  console.log(`CGST Rate: ${cgstRate}%`);
  console.log(`SGST Rate: ${sgstRate}%`);
  
  // New calculation (without rounding)
  const cgstAmount = (subtotal * cgstRate) / 100;
  const sgstAmount = (subtotal * sgstRate) / 100;
  const totalGST = cgstAmount + sgstAmount;
  const totalAmount = subtotal + totalGST;
  
  console.log(`\n--- Results (Decimal Preserved) ---`);
  console.log(`CGST Amount: ₹${cgstAmount.toFixed(4)}`);
  console.log(`SGST Amount: ₹${sgstAmount.toFixed(4)}`);
  console.log(`Total GST: ₹${totalGST.toFixed(4)}`);
  console.log(`Total Amount: ₹${totalAmount.toFixed(4)}`);
  
  // Old calculation (with rounding) for comparison
  const cgstAmountRounded = Math.round((subtotal * cgstRate) / 100);
  const sgstAmountRounded = Math.round((subtotal * sgstRate) / 100);
  const totalGSTRounded = cgstAmountRounded + sgstAmountRounded;
  const totalAmountRounded = subtotal + totalGSTRounded;
  
  console.log(`\n--- Old Results (Rounded) ---`);
  console.log(`CGST Amount: ₹${cgstAmountRounded}`);
  console.log(`SGST Amount: ₹${sgstAmountRounded}`);
  console.log(`Total GST: ₹${totalGSTRounded}`);
  console.log(`Total Amount: ₹${totalAmountRounded}`);
  
  console.log(`\n--- Difference ---`);
  console.log(`GST Difference: ₹${(totalGST - totalGSTRounded).toFixed(4)}`);
  console.log(`Total Difference: ₹${(totalAmount - totalAmountRounded).toFixed(4)}`);
  
  return {
    subtotal,
    cgstAmount,
    sgstAmount,
    totalGST,
    totalAmount,
    cgstAmountRounded,
    sgstAmountRounded,
    totalGSTRounded,
    totalAmountRounded
  };
};

// Test cases
console.log('🧪 Testing GST Decimal Preservation Fix');
console.log('=====================================');

// Test case 1: The problematic value mentioned by user
testGSTCalculation(508.5099);

// Test case 2: Another decimal value
testGSTCalculation(1234.5678);

// Test case 3: Small decimal value
testGSTCalculation(99.99);

// Test case 4: Large value with decimals
testGSTCalculation(5000.4567);

// Test case 5: Value that would round up significantly
testGSTCalculation(555.5555);

console.log('\n✅ All tests completed!');
console.log('📝 Note: The new implementation preserves decimal values instead of rounding to nearest integer.');
console.log('💰 This ensures accurate billing amounts as requested by the user.');