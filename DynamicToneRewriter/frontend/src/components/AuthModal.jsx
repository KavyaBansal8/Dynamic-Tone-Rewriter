import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { signUpWithEmail, signInWithEmail } from "../Firebase";
import useBodyScrollLock from "../hooks/useBodyScrollLock";

const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useBodyScrollLock(isAuthModalOpen);

  if (!isAuthModalOpen) return null;

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    closeAuthModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      resetForm();
      closeAuthModal();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative w-96 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 p-8 text-white shadow-2xl shadow-purple-950/50">
        <button
          type="button"
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          onClick={handleClose}
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold">{isLogin ? "Welcome back" : "Create an account"}</h2>
        <p className="mb-6 mt-1 text-sm text-white/60">
          {isLogin ? "Log in to continue to Emotion Intelligence Suite" : "Sign up to get started with Emotion Intelligence Suite"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white placeholder-white/40 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white placeholder-white/40 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-2.5 font-medium text-white transition hover:from-purple-600 hover:to-pink-600 disabled:opacity-60"
          >
            {isSubmitting ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <p
          className="mt-4 cursor-pointer text-center text-sm text-white/60 transition hover:text-white"
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
          }}
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
