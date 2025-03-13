// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");

// Create the Express app
const app = express();

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));



// Middleware to parse JSON payloads and trust proxy headers
app.use(express.json());
app.set('trust proxy', true);

// Connect to MongoDB
mongoose.connect('mongodb+srv://jayashmore278:couponclaim@cluster0.7gysj.mongodb.net/ClaimCoupon?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', error => console.error("MongoDB connection error:", error));
db.once('open', () => {
  console.log("Connected to MongoDB");
});

// Define the Coupon Claim schema with an index on ip and createdAt for performance
const couponClaimSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  couponId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
couponClaimSchema.index({ ip: 1, createdAt: 1 });
const CouponClaim = mongoose.model('CouponClaim', couponClaimSchema);

// Define an array of coupons for round-robin distribution
const couponList = [
  "COUPON1",
  "COUPON2",
  "COUPON3",
  "COUPON4",
  "COUPON5",
  "COUPON6",
  "COUPON7",
  "COUPON8",
  "COUPON9",
  "COUPON10"
];
let nextCouponIndex = 0;

app.get('/', async (req, res) => {
  res.send("HO RAHA");
 });
 

// Define the coupon claim endpoint to record an IP, restrict claims within one hour, and assign a coupon round-robin
app.post('/claim-coupon', async (req, res) => {
  // Extract the client IP from the request
  console.log("Received coupon claim request");
  
  const clientIp = req.ip || req.connection.remoteAddress;
  // Calculate the cutoff time (one hour ago)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  try {
    // Check if a coupon claim from this IP exists in the past hour
    const recentClaim = await CouponClaim.findOne({
      ip: clientIp,
      createdAt: { $gt: oneHourAgo }
    });
    
    if (recentClaim) {
      // If a claim is found, respond with a 429 status code to prevent duplicate claims
      return res.status(429).json({
        error: 'A coupon has already been claimed from this IP within the past hour.'
      });
    }
    
    // Assign coupon using round-robin distribution
    const assignedCoupon = couponList[nextCouponIndex];
    // Update the pointer (wrap around if necessary)
    nextCouponIndex = (nextCouponIndex + 1) % couponList.length;
    
    // Create a new coupon claim with the assigned coupon
    const newClaim = new CouponClaim({
      ip: clientIp,
      couponId: assignedCoupon
    });
    await newClaim.save();
    
    // Respond with a success message including the assigned coupon
    return res.status(200).json({ message: `Coupon ${assignedCoupon} claimed successfully!` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to check remaining time until the next coupon claim is allowed
app.get('/check-time', async (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  try {
    // Find the most recent claim from this IP
    const recentClaim = await CouponClaim.findOne({ ip: clientIp }).sort({ createdAt: -1 });

    if (!recentClaim) {
      return res.status(200).json({ remainingTime: 0, message: "You can claim a coupon now!" });
    }

    // Calculate the remaining time (in seconds)
    const claimTime = new Date(recentClaim.createdAt);
    const expiryTime = new Date(claimTime.getTime() + 60 * 60 * 1000);
    const now = new Date();
    const remainingTime = Math.max(0, (expiryTime - now) / 1000);

    if (remainingTime > 0) {
      return res.status(200).json({
        remainingTime,
        message: `You can claim another coupon in ${Math.ceil(remainingTime / 60)} minutes.`
      });
    } else {
      return res.status(200).json({ remainingTime: 0, message: "You can claim a coupon now!" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the Express server on port 3001
app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
