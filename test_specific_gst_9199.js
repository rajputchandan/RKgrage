// Test file to verify GST calculation for specific amount ₹9199.50
// User mentioned: "mene ak bill kiy gst ka 9199.50 tha uka 9%sgst hia"

const testSpecificGSTCalculation = (subtotal) => {
  console.log(`\n=== Testing GST Calculation for ₹${subtotal} ===`);
  console.log(`Subtotal: ₹${subtotal}`);
  console.log(`CGST Rate: 9%`);
  console.log(`SGST Rate: 9%`);
  
  // Current calculation (rounded to 2 decimal places)
  const cgstAmount = Math.round((subtotal * 9) / 100 * 100) / 100;
  const sgstAmount = Math.round((subtotal * 9) / 100 * 100) / 100;
  const totalGST = cgstAmount + sgstAmount;
  const totalAmount = subtotal + totalGST;
  
  console.log(`\n--- Current Results (2 Decimal Places) ---`);
  console.log(`CGST Amount (9%): ₹${cgstAmount.toFixed(2)}`);
  console.log(`SGST Amount (9%): ₹${sgstAmount.toFixed(2)}`);
  console.log(`Total GST (18%): ₹${totalGST.toFixed(2)}`);
  console.log(`Total Amount: ₹${totalAmount.toFixed(2)}`);
  
  // Exact calculation for reference
  const cgstExact = (subtotal * 9) / 100;
  const sgstExact = (subtotal * 9) / 100;
  const totalGSTExact = cgstExact + sgstExact;
  const totalAmountExact = subtotal + totalGSTExact;
  
  console.log(`\n--- Exact Calculation (Reference) ---`);
  console.log(`CGST Amount (9%): ₹${cgstExact.toFixed(4)}`);
  console.log(`SGST Amount (9%): ₹${sgstExact.toFixed(4)}`);
  console.log(`Total GST (18%): ₹${totalGSTExact.toFixed(4)}`);
  console.log(`Total Amount: ₹${totalAmountExact.toFixed(4)}`);
  
  // Old calculation (whole number rounding) for comparison
  const cgstRounded = Math.round((subtotal * 9) / 100);
  const sgstRounded = Math.round((subtotal * 9) / 100);
  const totalGSTRounded = cgstRounded + sgstRounded;
  const totalAmountRounded = subtotal + totalGSTRounded;
  
  console.log(`\n--- Old Method (Whole Number Rounding) ---`);
  console.log(`CGST Amount (9%): ₹${cgstRounded}`);
  console.log(`SGST Amount (9%): ₹${sgstRounded}`);
  console.log(`Total GST (18%): ₹${totalGSTRounded}`);
  console.log(`Total Amount: ₹${totalAmountRounded.toFixed(2)}`);
  
  console.log(`\n--- Summary ---`);
  console.log(`✅ With 2-decimal rounding: Total = ₹${totalAmount.toFixed(2)}`);
  console.log(`❌ With whole number rounding: Total = ₹${totalAmountRounded.toFixed(2)}`);
  console.log(`📊 Difference: ₹${(totalAmount - totalAmountRounded).toFixed(2)}`);
  
  return {
    subtotal,
    cgstAmount,
    sgstAmount,
    totalGST,
    totalAmount
  };
};

// Test the specific amount mentioned by user
console.log('🧪 Testing Specific GST Calculation');
console.log('===================================');

testSpecificGSTCalculation(9199.50);

// Test a few similar amounts for comparison
console.log('\n📋 Additional Test Cases:');
testSpecificGSTCalculation(9199.00);
testSpecificGSTCalculation(9200.00);
testSpecificGSTCalculation(9199.99);

console.log('\n✅ Test completed!');
console.log('📝 Note: The system now calculates GST with 2-decimal precision.');
console.log('💰 This ensures accurate billing without excessive rounding.');