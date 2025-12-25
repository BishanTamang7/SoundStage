import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState("attendee");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Close */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X />
        </button>

        {/* Header */}
        <h1 className="text-2xl font-bold text-center">Create account</h1>
        <p className="text-center text-gray-500 mt-1">
          Join us and start your journey
        </p>

        {/* Role Selection */}
        <div className="mt-6">
          <p className="text-sm font-medium mb-2">I want to join as</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setRole("attendee")}
              className={`border border-gray-300 rounded-xl p-4 text-center transition ${
                role === "attendee"
                  ? "border-red-500 bg-red-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <p className="font-semibold">Attendee</p>
              <p className="text-sm text-gray-500">Discover & join events</p>
            </button>

            <button
              onClick={() => setRole("organizer")}
              className={`border border-gray-300 rounded-xl p-4 text-center transition ${
                role === "organizer"
                  ? "border-red-500 bg-red-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <p className="font-semibold">Organizer</p>
              <p className="text-sm text-gray-500">Create & manage events</p>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="mt-6 space-y-4">
          {/* Username */}
          <div>
            <label className="text-sm font-medium">Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium">Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-red-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-medium">Confirm Password</label>
            <div className="relative mt-1">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-red-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2.5 text-gray-400"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={() => {
              if (role === "organizer") {
                navigate("/user2/home");
              } else {
                navigate("/user1/home");
              }
            }}
            className="w-full mt-4 py-3 rounded-xl text-white font-semibold bg-red-500 hover:bg-red-600 transition"
          >
            Create Account
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-3 text-sm text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-red-500 font-medium cursor-pointer hover:underline"
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}