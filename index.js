const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ১. ডেটা লোড করা (সার্ভার চালু হওয়ার সময় একবারই মেমরিতে লোড হবে)
let db = {};
try {
  const dataFile = path.join(__dirname, "data.json");
  if (fs.existsSync(dataFile)) {
    db = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    console.log("✅ Data loaded successfully.");
  }
} catch (error) {
  console.error("❌ Error loading data.json:", error.message);
}

// ==========================================
// ২. রাউটস (Endpoints)
// ==========================================

// হোম রুট (সার্ভার অনলাইন কি না চেক করার জন্য)
app.get("/", (req, res) => {
  res.json({
    status: "online",
    name: "Diablo Moodswings API",
    author: "protik",
    total_main_categories: Object.keys(db).length,
    endpoints: {
      categories_list: "/api/categories",
      get_media: "/api/media?category=romance%20store&subcategory=kissing_type1"
    }
  });
});

// সব ক্যাটাগরি এবং সাব-ক্যাটাগরির লিস্ট
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

// র‍্যান্ডম মিডিয়া (ভিডিও) লিংক নেওয়ার রুট
app.get("/api/media", (req, res) => {
  try {
    const { category, subcategory } = req.query; // উদাহরণ: category=instagirl&subcategory=mahakbora

    if (!category || !subcategory) {
      return res.status(400).json({ error: "Please provide both category and subcategory" });
    }

    const mainCat = db[category];
    if (!mainCat) {
      return res.status(404).json({ error: `Main category '${category}' not found` });
    }

    const subCat = mainCat[subcategory];
    if (!subCat || subCat.length === 0) {
      return res.status(404).json({ error: `Subcategory '${subcategory}' not found or empty` });
    }

    // র‍্যান্ডম একটা ভিডিও লিংক পিক করা
    const randomUrl = subCat[Math.floor(Math.random() * subCat.length)];
    
    // বটে সরাসরি স্ট্রিম পাঠানোর জন্য রিডাইরেক্ট করা
    res.redirect(randomUrl);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// সার্ভার চালু
app.listen(PORT, () => {
  console.log(`🚀 Diablo Moodswings API running on port ${PORT}`);
});
