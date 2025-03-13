require('dotenv').config();

// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
const Counter = require('./models/counterModel');

// const port = "https://coupon-claimbackend.vercel.app/"

// Create the Express app
const app = express();

// const corsOptions = {
//   origin: 'http://localhost:3000',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   credentials: true,
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   optionsSuccessStatus: 200 // For legacy browser support
// };

// app.use(cors(corsOptions));
// app.options('*', cors(corsOptions));


const corsOptions = {
  origin: 'https://coupon-claimfrontend.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


// Connect to MongoDB

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', error => console.error("MongoDB connection error:", error));
db.once('open', () => {
  console.log("Connected to MongoDB");
});

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
    try {
      // Atomically increment the counter (or create it if it doesn't exist)
      const counter = await Counter.findOneAndUpdate(
        { name: 'couponCounter' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      
      // Calculate the coupon index globally using modulo
      const couponIndex = (counter.seq - 1) % couponList.length;
      const assignedCoupon = couponList[couponIndex];

      // Optionally, you can record this claim in your CouponClaim model here

      return res.status(200).json({ message: `Coupon ${assignedCoupon} claimed successfully!` });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

// // Start the Express server on port 3001
// app.listen(3001, () => {
//   console.log('Server is running on port');
// });


module.exports = app;

