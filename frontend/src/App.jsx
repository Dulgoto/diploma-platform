import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import AdsList from "./pages/AdsList.jsx";
import AdDetails from "./pages/AdDetails.jsx";
import PostAd from "./pages/PostAd.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface)]">
      <Navbar />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ads" element={<AdsList />} />
          <Route path="/ads/:id" element={<AdDetails />} />
          <Route
            path="/post-ad"
            element={
              <ProtectedRoute>
                <PostAd />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-200/80 bg-white/80 py-4 text-center text-sm text-[var(--color-muted)]">
        Дипломна платформа за обяви — демо интерфейс
      </footer>
    </div>
  );
}
