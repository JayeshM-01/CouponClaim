import React, { useState, useEffect } from 'react';
import { Wheel } from 'react-custom-roulette';

// Spinner data with promotional text and corresponding coupon codes
const couponData = [
  { option: '50% OFF', couponCode: 'COUPON1' },
  { option: 'Buy 1 Get 1 Free', couponCode: 'COUPON2' },
  { option: 'Free Shipping', couponCode: 'COUPON3' },
  { option: '$10 OFF', couponCode: 'COUPON4' },
  { option: '20% OFF', couponCode: 'COUPON5' },
  { option: '30% OFF', couponCode: 'COUPON6' },
  { option: '15% OFF', couponCode: 'COUPON7' },
  { option: 'No Coupon', couponCode: 'COUPON8' },
  { option: 'Extra 5% OFF', couponCode: 'COUPON9' },
  { option: 'Free Gift', couponCode: 'COUPON10' }
];

const ClaimCoupon = () => {
  const [message, setMessage] = useState('');
  const [remainingTime, setRemainingTime] = useState(0); // in seconds
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  // Fetch remaining time from the backend
  const checkRemainingTime = async () => {
    try {
      const response = await fetch('https://coupon-claimbackend.vercel.app/check-time');
      const data = await response.json();
      setRemainingTime(Math.ceil(data.remainingTime));
    } catch (error) {
      setMessage('Error checking remaining time.');
    }
  };

  // Claim coupon and trigger the spinner
  const handleSpinClick = async () => {
    // Allow spin only if not spinning and cooldown has expired.
    if (remainingTime > 0 || mustSpin) return;
    try {
      const response = await fetch('https://coupon-claimbackend.vercel.app/claim-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // couponId here is a dummy value; backend uses round-robin logic.
        body: JSON.stringify({ couponId: 'COUPON?' })
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error);
        checkRemainingTime();
      } else {
        setMessage(data.message);
        // Expected response format: "Coupon COUPONx claimed successfully!"
        const match = data.message.match(/Coupon (\w+) claimed successfully/);
        if (match) {
          const couponCode = match[1];
          // Find the index of the coupon in couponData based on couponCode
          const index = couponData.findIndex(item => item.couponCode === couponCode);
          if (index !== -1) {
            setPrizeNumber(index);
            setMustSpin(true);
          } else {
            setMessage('Received coupon code not found in spinner data.');
          }
        } else {
          setMessage('Unexpected response format.');
        }
      }
    } catch (error) {
      setMessage('Error claiming coupon.');
    }
  };

  // When the wheel stops spinning, show a popup with the coupon info
  const onStopSpinning = () => {
    setMustSpin(false);
    const selectedData = couponData[prizeNumber];
    setPopupMessage(`Congratulations! You've won ${selectedData.option}. Your coupon code is: ${selectedData.couponCode}`);
    setShowPopup(true);
    checkRemainingTime();
  };

  // Poll the backend for remaining time every second
  useEffect(() => {
    checkRemainingTime();
    const interval = setInterval(() => {
      setRemainingTime(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format remaining time for display (minutes and seconds)
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  return (
    <div className="max-w-md mx-auto p-4 text-center">
      <h2 className="text-2xl font-bold mb-4">Spin to Claim Your Coupon</h2>
      {remainingTime > 0 ? (
        <p className="mb-4">
          Next spin available in: <strong>{minutes} min {seconds} sec</strong>
        </p>
      ) : (
        <p className="mb-4">You can spin and claim a coupon now!</p>
      )}
      <div className="mt-4">
        <Wheel
          mustStartSpinning={mustSpin}
          prizeNumber={prizeNumber}
          data={couponData}
          backgroundColors={['#3e3e3e', '#df3428']}
          textColors={['#ffffff']}
          fontSize={16}
          onStopSpinning={onStopSpinning}
        />
      </div>
      <div className="mt-4">
        <button
          onClick={handleSpinClick}
          disabled={remainingTime > 0 || mustSpin}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {remainingTime > 0 ? `Wait ${minutes}:${seconds.toString().padStart(2, '0')}` : "Spin & Claim Coupon"}
        </button>
      </div>

      {/* Modal Popup for Coupon Code */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg text-center">
            <h2 className="text-xl font-bold mb-4">Your Coupon</h2>
            <p>{popupMessage}</p>
            <button
              onClick={() => setShowPopup(false)}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimCoupon;
