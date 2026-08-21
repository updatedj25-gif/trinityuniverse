console.log("==========================================================");
console.log("1. GENERATING TWO STANDALONE BASE64 TEST IMAGES");
console.log("==========================================================");

// Valid 1x1 base64 JPEG data URLs (100% standalone, no external downloads)
const testImageA = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
const testImageB = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

async function runTests() {
  const customUrl = "https://trinityuniverse.org";

  // 1. Test Gnosis AI with formatted messages array
  console.log("\n==========================================================");
  console.log("2. TESTING GNOSIS AI (/api/chat)");
  console.log("==========================================================");
  try {
    const gnosisRes = await fetch(`${customUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello Gnosis, reply in one sentence." }],
        tenant: "gnosis",
        tenantId: "gnosis",
        systemInstruction: "You are Gnosis AI."
      })
    });
    console.log(`HTTP Status: ${gnosisRes.status} ${gnosisRes.statusText}`);
    const text = await gnosisRes.text();
    console.log("Raw Response:\n", text);
  } catch (err) {
    console.error("Gnosis Test Error:", err.message);
  }

  // 2. Test Yada Guide with formatted messages array
  console.log("\n==========================================================");
  console.log("3. TESTING YADA GUIDE (/api/chat)");
  console.log("==========================================================");
  try {
    const yadaRes = await fetch(`${customUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello Yada, reply in one sentence." }],
        tenant: "yada",
        tenantId: "yada",
        systemInstruction: "You are Yada."
      })
    });
    console.log(`HTTP Status: ${yadaRes.status} ${yadaRes.statusText}`);
    const text = await yadaRes.text();
    console.log("Raw Response:\n", text);
  } catch (err) {
    console.error("Yada Test Error:", err.message);
  }

  // 3. Test Face Swap Generation with standalone Base64 images
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
    console.log("Raw Response:\n", text);
  } catch (err) {
    console.error("Face Swap Test Error:", err.message);
  }
}

runTests();
