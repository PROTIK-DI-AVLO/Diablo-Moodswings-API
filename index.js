const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ==========================================
// ১. ডেটা লোড করা (সার্ভার চালু হওয়ার সময় একবারই)
// ==========================================
let db = { videos: {}, pics: {} };

try {
  const dataFile = path.join(__dirname, "data.json");
  if (fs.existsSync(dataFile)) {
    db = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    console.log("✅ Data loaded successfully.");
  }
} catch (error) {
  console.error("❌ Error loading data.json:", error.message);
}

// হেল্পার ফাংশন: লিস্ট থেকে র‍্যান্ডম একটা লিংক নেওয়া
function getRandomLink(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ==========================================
// ২. পেয়ার (Pair) ব্যাকগ্রাউন্ড লিংক
// ==========================================
const pairBackgrounds = {
  1: "https://files.catbox.moe/fqywvs.jpg",
  2: "https://files.catbox.moe/ksraft.jpg",
  3: "https://files.catbox.moe/lemb3h.jpg",
  4: "https://files.catbox.moe/kqvpij.jpg",
  // ৫ নম্বরটা জেন্ডার ভিত্তিক, নিচে আলাদা হ্যান্ডেল করা হবে
  6: "https://files.catbox.moe/m3icp9.jpg",
  7: "https://files.catbox.moe/vezr8o.jpg",
  8: "https://files.catbox.moe/q8vkup.jpg",
  9: "https://files.catbox.moe/rl9x14.jpg",
  10: "https://files.catbox.moe/rsxqq3.jpg",
  11: "https://files.catbox.moe/zbpsv1.jpg",
  12: "https://files.catbox.moe/ll4vw8.jpg"
};

const pair5MaleBg = "https://files.catbox.moe/it9z70.jpg";
const pair5FemaleBg = "https://files.catbox.moe/reie13.jpg";


// ==========================================
// ৩. হোম এন্ডপয়েন্ট (স্ট্যাটাস চেক)
// ==========================================
app.get("/", (req, res) => {
  res.json({
    status: "online",
    name: "Diablo Moodswings API",
    author: "protik",
    total_video_categories: Object.keys(db.videos || {}).length,
    total_pic_categories: Object.keys(db.pics || {}).length,
    endpoints: {
      video_categories: "/api/categories",
      random_media: "/api/media?category=romance%20store&subcategory=kissing_type1",
      pair_background: "/api/pair/background?style=1&gender=MALE"
    }
  });
});

// ==========================================
// ৪. ক্যাটাগরি লিস্ট
// ==========================================
app.get("/api/categories", (req, res) => {
  try {
    const result = {};
    for (const mainCat in db) {
      result[mainCat] = Object.keys(db[mainCat]).map(subCat => ({
        name: subCat,
        count: db[mainCat][subCat].length
      }));
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to load categories" });
  }
});

// ==========================================
// ৫. মিডিয়া স্ট্রিমিং (ভিডিও / পিক)
// ==========================================
app.get("/api/media", async (req, res) => {
  try {
    const { category, subcategory } = req.query;
    if (!category || !subcategory) return res.status(400).json({ error: "Missing params" });

    const mainCat = db[category];
    if (!mainCat) return res.status(404).json({ error: "Main category not found" });

    const subCat = mainCat[subcategory];
    if (!subCat || subCat.length === 0) return res.status(404).json({ error: "Subcategory not found" });

    const randomUrl = subCat[Math.floor(Math.random() * subCat.length)];
    
    // API নিজেই ভিডিওটা ডাউনলোড করে স্ট্রিম করবে
    const response = await axios({
      method: "GET",
      url: randomUrl,
      responseType: "stream",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    res.setHeader("Content-Type", response.headers["content-type"] || "video/mp4");
    response.data.pipe(res);

  } catch (error) {
    console.error("Stream Error:", error.message);
    res.status(500).json({ error: "Failed to stream media" });
  }
});

// ==========================================
// ৬. পেয়ার (Pair) ব্যাকগ্রাউন্ড রাউট
// ==========================================
app.get("/api/pair/background", (req, res) => {
  try {
    const style = parseInt(req.query.style);
    const gender = (req.query.gender || "").toUpperCase();

    // যদি pair5 (style 5) হয়, তবে জেন্ডার চেক করব
    if (style === 5) {
      if (gender === "MALE") return res.json({ image: pair5MaleBg });
      if (gender === "FEMALE") return res.json({ image: pair5FemaleBg });
      // জেন্ডার না জানা থাকলে ডিফল্ট ছেলের ছবিটা দিবে
      return res.json({ image: pair5MaleBg }); 
    }

    // বাকি স্টাইলগুলোর জন্য
    const bgUrl = pairBackgrounds[style];
    if (!bgUrl) {
      // যদি ভুল স্টাইল নাম্বার দেয়, তবে ১ নম্বর ডিফল্ট হিসেবে যাবে
      return res.json({ image: pairBackgrounds[1] });
    }

    res.json({ image: bgUrl });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// সার্ভার চালু
app.listen(PORT, () => {
  console.log(`🚀 Diablo Moodswings API running on port ${PORT}`);
});
