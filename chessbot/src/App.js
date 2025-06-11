// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import ChessBotMVP from "./chessBotMVP";

function Home() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to the Expo App</h1>
      <Link to="/chess" className="px-4 py-2 bg-blue-600 text-white rounded">
        Play Chess Bot
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chess" element={<ChessBotMVP />} />
      </Routes>
    </Router>
  );
}