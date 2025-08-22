// Test script to verify the inventory logic without requiring MongoDB
console.log('🧪 Testing inventory management logic...\n');

// Simulate the inventory calculation logic from the controller
function testInventoryCalculation() {
  // Simulate existing job card parts
  const existingParts = [
    { part_id: 'part1', quantity: 2 },
    { part_id: 'part2', quantity: 1 }
  ];

  // Simulate updated parts (part1 quantity changed from 2 to 3, part2 removed, part3 added)
  const updatedParts = [
    { part_id: 'part1', quantity: 3 },
    { part_id: 'part3', quantity: 1 }
  ];

  console.log('📊 Test Case 1: Mixed updates (quantity change, removal, addition)');
  console.log('Existing parts:', existingParts);
  console.log('Updated parts:', updatedParts);

  // Create maps for easier comparison (same logic as controller)
  const existingPartsMap = new Map();
  existingParts.forEach(part => {
    const key = part.part_id.toString();
    existingPartsMap.set(key, part.quantity);
  });

  const newPartsMap = new Map();
  updatedParts.forEach(partItem => {
    const key = partItem.part_id.toString();
    newPartsMap.set(key, (newPartsMap.get(key) || 0) + partItem.quantity);
  });

  // Calculate inventory changes needed
  const inventoryChanges = new Map();

  // Check parts that were removed or quantity decreased
  existingPartsMap.forEach((oldQty, partId) => {
    const newQty = newPartsMap.get(partId) || 0;
    const difference = newQty - oldQty;
    if (difference !== 0) {
      inventoryChanges.set(partId, difference);
    }
  });

  // Check parts that were added
  newPartsMap.forEach((newQty, partId) => {
    if (!existingPartsMap.has(partId)) {
      inventoryChanges.set(partId, newQty);
    }
  });

  console.log('\n📈 Calculated inventory changes:');
  inventoryChanges.forEach((change, partId) => {
    const action = change > 0 ? 'reduce stock by' : 'restore stock by';
    console.log(`   ${partId}: ${action} ${Math.abs(change)} (change: ${change})`);
  });

  // Expected results:
  // part1: +1 (reduce stock by 1)
  // part2: -1 (restore stock by 1) 
  // part3: +1 (reduce stock by 1)

  const expectedChanges = new Map([
    ['part1', 1],
    ['part2', -1], 
    ['part3', 1]
  ]);

  console.log('\n✅ Expected changes:');
  expectedChanges.forEach((change, partId) => {
    const action = change > 0 ? 'reduce stock by' : 'restore stock by';
    console.log(`   ${partId}: ${action} ${Math.abs(change)} (change: ${change})`);
  });

  // Verify results
  let testPassed = true;
  expectedChanges.forEach((expectedChange, partId) => {
    const actualChange = inventoryChanges.get(partId);
    if (actualChange !== expectedChange) {
      console.log(`❌ MISMATCH for ${partId}: expected ${expectedChange}, got ${actualChange}`);
      testPassed = false;
    }
  });

  if (testPassed) {
    console.log('\n✅ Test Case 1 PASSED: Inventory logic is working correctly!');
  } else {
    console.log('\n❌ Test Case 1 FAILED: Inventory logic has issues!');
  }

  return testPassed;
}

// Test case 2: Same part multiple times in update
function testDuplicatePartsInUpdate() {
  console.log('\n\n📊 Test Case 2: Same part appears multiple times in update');
  
  const existingParts = [
    { part_id: 'part1', quantity: 2 }
  ];

  // Same part appears twice in the update (should be combined)
  const updatedParts = [
    { part_id: 'part1', quantity: 1 },
    { part_id: 'part1', quantity: 2 }
  ];

  console.log('Existing parts:', existingParts);
  console.log('Updated parts (with duplicates):', updatedParts);

  const existingPartsMap = new Map();
  existingParts.forEach(part => {
    const key = part.part_id.toString();
    existingPartsMap.set(key, part.quantity);
  });

  const newPartsMap = new Map();
  updatedParts.forEach(partItem => {
    const key = partItem.part_id.toString();
    newPartsMap.set(key, (newPartsMap.get(key) || 0) + partItem.quantity);
  });

  console.log('Combined new parts map:', Array.from(newPartsMap.entries()));

  const inventoryChanges = new Map();
  existingPartsMap.forEach((oldQty, partId) => {
    const newQty = newPartsMap.get(partId) || 0;
    const difference = newQty - oldQty;
    if (difference !== 0) {
      inventoryChanges.set(partId, difference);
    }
  });

  newPartsMap.forEach((newQty, partId) => {
    if (!existingPartsMap.has(partId)) {
      inventoryChanges.set(partId, newQty);
    }
  });

  console.log('\n📈 Calculated inventory changes:');
  inventoryChanges.forEach((change, partId) => {
    const action = change > 0 ? 'reduce stock by' : 'restore stock by';
    console.log(`   ${partId}: ${action} ${Math.abs(change)} (change: ${change})`);
  });

  // Expected: part1 should have change of +1 (from 2 to 3 total)
  const expectedChange = 1;
  const actualChange = inventoryChanges.get('part1');
  
  if (actualChange === expectedChange) {
    console.log('\n✅ Test Case 2 PASSED: Duplicate parts handled correctly!');
    return true;
  } else {
    console.log(`\n❌ Test Case 2 FAILED: Expected change ${expectedChange}, got ${actualChange}`);
    return false;
  }
}

// Run tests
const test1Passed = testInventoryCalculation();
const test2Passed = testDuplicatePartsInUpdate();

if (test1Passed && test2Passed) {
  console.log('\n🎉 ALL TESTS PASSED: Inventory logic is working correctly!');
} else {
  console.log('\n💥 SOME TESTS FAILED: There are issues with the inventory logic!');
}