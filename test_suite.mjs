// 1. Create two test image Base64 payloads
console.log("==========================================================");
console.log("1. GENERATING TEST IMAGES FOR FACE SWAP");
console.log("==========================================================");

const testImageA = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";
const testImageB = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80";

console.log("✓ Test Image A (Original Body): Ready");
console.log("✓ Test Image B (Target Face):   Ready");

async function runTests() {
  const workerUrl = "https://gnosis-master.adebolajames145.workers.dev";
  const customUrl = "https://trinityuniverse.org";

  // Test Gnosis AI Chat on Custom Domain
  console.log("\n==========================================================");
  console.log("2. TESTING GNOSIS AI (/api/chat) on trinityuniverse.org");
  console.log("==========================================================");
  try {
    const gnosisRes = await fetch(`${customUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Hello Gnosis, reply with exactly: 'Gnosis AI online'",
        tenantId: "gnosis",
        systemInstruction: "You are Gnosis AI."
      })
    });
    console.log(`HTTP Status: ${gnosisRes.status} ${gnosisRes.statusText}`);
    const text = await gnosisRes.text();
    console.log("Raw Response:\n", text.slice(0, 500));
  } catch (err) {
    console.error("Gnosis Test Error:", err.message);
  }

  // Test Yada Guide Chat on Custom Domain
  console.log("\n==========================================================");
  console.log("3. TESTING YADA GUIDE (/api/chat) on trinityuniverse.org");
  console.log("==========================================================");
  try {
    const yadaRes = await fetch(`${customUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Hello Yada, reply with exactly: 'Yada Guide online'",
        tenantId: "yada",
        systemInstruction: "You are Yada."
      })
    });
    console.log(`HTTP Status: ${yadaRes.status} ${yadaRes.statusText}`);
    const text = await yadaRes.text();
    console.log("Raw Response:\n", text.slice(0, 500));
  } catch (err) {
    console.error("Yada Test Error:", err.message);
  }

  // Test Face Swap API Endpoint
  console.log("\n==========================================================");
  console.log("4. TESTING FACE SWAP PIPELINE (/api/faceswap/generate)");
  console.log("==========================================================");
  try {
    const swapRes = await fetch(`${customUrl}/api/faceswap/generate`, {
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
    console.log("Raw Response:\n", text.slice(0, 500));
  } catch (err) {
    console.error("Face Swap Test Error:", err.message);
  }
}

runTests();
