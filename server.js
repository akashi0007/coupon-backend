import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const MONGO_URL = process.env.MONGO_URL;

// MongoDB connection
mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB connection error:", err));

// Coupon Schema
const couponSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  redeemed: { type: Boolean, default: false }
});

const Coupon = mongoose.model("Coupon", couponSchema);

// Utility function to generate coupon code
function generateCouponCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "CPN-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Root endpoint
app.get("/", (req, res) => {
  res.send("Coupon Backend is running! Use /generate, /redeem, /reset");
});

// Generate coupon (one per phone)
app.post("/generate", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone number is required" });

  try {
    let coupon = await Coupon.findOne({ phone });
    if (coupon) {
      return res.json({
        message: "Coupon already exists for this phone",
        code: coupon.code,
        phone: coupon.phone,
        redeemed: coupon.redeemed
      });
    }

    const newCoupon = new Coupon({
      phone,
      code: generateCouponCode(),
      redeemed: false
    });

    await newCoupon.save();
    res.json({
      message: "Coupon generated",
      code: newCoupon.code,
      phone: newCoupon.phone,
      redeemed: newCoupon.redeemed
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Redeem coupon
app.post("/redeem", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Coupon code is required" });

  try {
    const coupon = await Coupon.findOne({ code });
    if (!coupon) return res.status(404).json({ error: "Coupon not found" });
    if (coupon.redeemed) return res.status(400).json({ error: "Coupon already redeemed" });

    coupon.redeemed = true;
    await coupon.save();
    res.json({ message: "Coupon redeemed", code: coupon.code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Reset coupon (for testing)
app.post("/reset", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Coupon code is required" });

  try {
    const coupon = await Coupon.findOne({ code });
    if (!coupon) return res.status(404).json({ error: "Coupon not found" });

    coupon.redeemed = false;
    await coupon.save();
    res.json({ message: "Coupon reset for testing", code: coupon.code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Coupon Backend is running! Use /generate and /redeem endpoints.");
});


