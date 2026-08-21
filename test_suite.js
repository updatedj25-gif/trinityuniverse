const fs = require('fs');

// 1. Create two test images (Image A and Image B) as Base64 JPEG data
console.log("==========================================================");
console.log("1. GENERATING TWO TEST IMAGES FOR FACE SWAP");
console.log("==========================================================");

// Minimal 1x1 valid base64 JPEG representations for testing
const testImageA = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
const testImageB = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

console.log("✓ Test Image A (Original Body): Ready (Base64 JPEG)");
console.log("✓ Test Image B (Target Face):   Ready (Base64 JPEG)");

async function runTests() {
  const workerUrl = "https://gnosis-master.adebolajames145.workers.dev";

  // Test Gnosis AI Chat
  console.log("\n==========================================================");
  console.log("2. TESTING GNOSIS AI (/api/chat)");
  console.log("==========================================================");
  try {
    const gnosisRes = await fetch(`${workerUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Hello Gnosis, explain real-time event streaming in one sentence.",
        tenantId: "gnosis",
        systemInstruction: "You are Gnosis AI, a sharp technical intellect."
      })
    });
    console.log(`HTTP Status: ${gnosisRes.status} ${gnosisRes.statusText}`);
    const text = await gnosisRes.text();
    console.log("Raw Response:\n", text.slice(0, 500));
  } catch (err) {
    console.error("Gnosis Test Error:", err.message);
  }

  // Test Yada Guide Chat
  console.log("\n==========================================================");
  console.log("3. TESTING YADA GUIDE (/api/chat)");
  console.log("==========================================================");
  try {
    const yadaRes = await fetch(`${workerUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Hello Yada, share a short reflection on mindfulness.",
        tenantId: "yada",
        systemInstruction: "You are Yada, a calm spiritual guide."
      })
    });
    console.log(`HTTP Status: ${yadaRes.status} ${yadaRes.statusText}`);
    const text = await yadaRes.text();
    console.log("Raw Response:\n", text.slice(0, 500));
  } catch (err) {
    console.error("Yada Test Error:", err.message);
  }

  // Test Face Swap API Endpoint with the two generated images
  console.log("\n==========================================================");
  console.log("4. TESTING FACE SWAP PIPELINE (/api/faceswap/generate)");
  console.log("==========================================================");
  try {
    const swapRes = await fetch(`${workerUrl}/api/faceswap/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originalImage: testImageA,
        targetFaceImage: testImageB,
        swappedResult: testImageB,
        mode: "single",
        mediaType: "photo"
      })
    });
    console.log(`HTTP Status: ${swapRes.status} ${swapRes.statusText}`);
    const text = await swapRes.text();
    console.log("Raw Response:\n", text);
  } catch (err) {
    console.error("Face Swap Test Error:", err.message);
  }
}

runTests();
