  const couponSchema = new mongoose.Schema({
    couponCode: { type: String, required: true }, // e.g., "COUPON1"
    description: { type: String, required: true } // e.g., "50% OFF"
  });
  
  const Coupon = mongoose.model('Coupon', couponSchema);
  
  