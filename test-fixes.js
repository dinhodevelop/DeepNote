// Test script to verify the fixes for DeepNote
// Run this in the browser console to test the application

async function testDeepNoteFixes() {
  console.log('🧪 Testing DeepNote fixes...');
  
  // Test 1: Check if storageAPI is available and working
  console.log('\n1. Testing Storage API...');
  if (!window.storageAPI) {
    console.error('❌ StorageAPI not available');
    return;
  }
  
  try {
    const notes = await window.storageAPI.getNotes();
    console.log('✅ Storage API working, found', notes.length, 'notes');
  } catch (error) {
    console.error('❌ Storage API error:', error);
    return;
  }
  
  // Test 2: Check error monitoring
  console.log('\n2. Testing Error Monitor...');
  if (!window.errorMonitor) {
    console.error('❌ Error Monitor not available');
  } else {
    const health = window.errorMonitor.checkHealth();
    console.log('✅ Error Monitor working, health:', health);
  }
  
  // Test 3: Test note creation
  console.log('\n3. Testing Note Creation...');
  try {
    const testNote = {
      id: 'test-' + Date.now(),
      title: 'Test Note',
      content: 'This is a test note created by the test script',
      created: Date.now(),
      updated: Date.now()
    };
    
    await window.storageAPI.saveNote(testNote);
    console.log('✅ Note creation successful');
    
    // Test note update
    await window.storageAPI.updateNote(testNote.id, {
      content: 'Updated content',
      updated: Date.now()
    });
    console.log('✅ Note update successful');
    
    // Clean up test note
    await window.storageAPI.deleteNote(testNote.id);
    console.log('✅ Note deletion successful');
    
  } catch (error) {
    console.error('❌ Note operations error:', error);
  }
  
  // Test 4: Test auto-save mechanism
  console.log('\n4. Testing Auto-save...');
  if (typeof autoSave === 'function') {
    console.log('✅ Auto-save function available');
  } else {
    console.error('❌ Auto-save function not found');
  }
  
  // Test 5: Test task manager
  console.log('\n5. Testing Task Manager...');
  if (!window.taskManager) {
    console.error('❌ Task Manager not available');
  } else {
    console.log('✅ Task Manager available');
  }
  
  console.log('\n🎉 Test completed! Check the results above.');
}

// Function to simulate heavy usage
async function simulateHeavyUsage() {
  console.log('🔄 Simulating heavy usage...');
  
  for (let i = 0; i < 10; i++) {
    try {
      // Create a note
      const note = {
        id: 'stress-test-' + i + '-' + Date.now(),
        title: `Stress Test Note ${i}`,
        content: `Content for stress test note ${i}`,
        created: Date.now(),
        updated: Date.now()
      };
      
      await window.storageAPI.saveNote(note);
      
      // Update it multiple times
      for (let j = 0; j < 3; j++) {
        await window.storageAPI.updateNote(note.id, {
          content: `Updated content ${j}`,
          updated: Date.now()
        });
        
        // Small delay to simulate typing
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`✅ Stress test ${i + 1}/10 completed`);
      
    } catch (error) {
      console.error(`❌ Stress test ${i + 1} failed:`, error);
    }
  }
  
  console.log('🎉 Heavy usage simulation completed!');
}

// Export functions for manual testing
window.testDeepNoteFixes = testDeepNoteFixes;
window.simulateHeavyUsage = simulateHeavyUsage;

console.log('🧪 Test functions loaded. Run testDeepNoteFixes() or simulateHeavyUsage() in console.');
