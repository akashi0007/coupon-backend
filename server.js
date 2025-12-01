import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// --- DB CONNECTION ---
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log(err));

// --- Coupon Schema ---
const couponSchema = new mongoose.Schema({
  phone: String,
  code: String,
  redeemed: { type: Boolean, default: false }
});

const Coupon = mongoose.model("Coupon", couponSchema);

// --- ROUTES ---

// Generate coupon
app.post("/generate", async (req, res) => {
  const { phone } = req.body;

  const code = 
    "CPN-" +
    Math.random().toString(36).substring(2, 8).toUpperCase() +
    "-" +
    Date.now().toString().slice(-4);

  const coupon = await Coupon.create({ phone, code });

  res.json(coupon);
});

// Redeem coupon
app.post("/redeem", async (req, res) => {
  const { code } = req.body;

  const coupon = await Coupon.findOne({ code });

  if (!coupon) {
    return res.json({ status: "invalid" });
  }

  if (coupon.redeemed) {
    return res.json({ status: "already" });
  }

  coupon.redeemed = true;
  await coupon.save();

  res.json({ status: "success", phone: coupon.phone });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started on port " + PORT));
