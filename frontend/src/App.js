import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ClaimCoupon from './Pages/claimcoupon';

function App() {
  return (
    <Router>
      <div className="App">
          <Routes>
            <Route path="/" element={<ClaimCoupon />} />
          </Routes>
      </div>
  </Router>
  );
}

export default App;
