import React, { useState } from "react";
import { useAuth } from "../AuthContext";

const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl text-black font-bold mb-4">{isLogin ? "Login" : "Sign Up"}</h2>
        <input type="email" placeholder="Email" className="w-full p-2 mb-3 border rounded" />
        <input type="password" placeholder="Password" className="w-full p-2 mb-3 border rounded" />
        {!isLogin && <input type="text" placeholder="Username" className="w-full p-2 mb-3 border rounded" />}
        <button className="w-full bg-blue-500 text-white p-2 rounded mb-3 hover:bg-blue-600">
          {isLogin ? "Login" : "Sign Up"}
        </button>
        <p className="text-sm text-gray-600 cursor-pointer" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
        </p>
        <button className="absolute top-2 right-2 w-20 h-20 text-red-600 hover:text-gray-900" onClick={closeAuthModal}>
            ❌
        </button>
      </div>
    </div>
  );
};

export default AuthModal;


// import React, { useState } from "react";
// import { signInWithGoogle, signInWithFacebook, signUpWithEmail, signInWithEmail } from "../auth";

// const AuthModal = ({ onClose }) => {
//   const [isSignup, setIsSignup] = useState(true);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const handleAuth = async () => {
//     if (isSignup) {
//       await signUpWithEmail(email, password);
//     } else {
//       await signInWithEmail(email, password);
//     }
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
//       <div className="bg-white p-6 rounded-md text-center">
//         <h2 className="text-2xl font-bold mb-4">{isSignup ? "Sign Up" : "Sign In"}</h2>
//         <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 w-full mb-2" />
//         <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 w-full mb-4" />
//         <button onClick={handleAuth} className="bg-blue-500 text-white px-4 py-2 rounded-md mb-2 w-full">
//           {isSignup ? "Sign Up" : "Sign In"}
//         </button>
//         <button onClick={signInWithGoogle} className="bg-red-500 text-white px-4 py-2 rounded-md mb-2 w-full">
//           Sign in with Google
//         </button>
//         <button onClick={signInWithFacebook} className="bg-blue-700 text-white px-4 py-2 rounded-md mb-2 w-full">
//           Sign in with Facebook
//         </button>
//         <p className="mt-4 cursor-pointer text-blue-500" onClick={() => setIsSignup(!isSignup)}>
//           {isSignup ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
//         </p>
//         <button onClick={onClose} className="mt-4 bg-gray-500 text-white px-4 py-2 rounded-md">
//           Close
//         </button>
//       </div>
//     </div>
//   );
// };

// export default AuthModal;