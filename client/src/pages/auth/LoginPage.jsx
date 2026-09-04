
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../../services/auth.service";
import { AuthContext } from "../../context/AuthContext";



function LoginPage() {

    const navigate = useNavigate();

const { login } =
  useContext(AuthContext);
  
  const [mobileNumber, setMobileNumber] =
    useState("");

  const [password, setPassword] =
    useState("");

const handleLogin = async () => {
  try {
    const response = await loginUser({
      mobileNumber,
      password,
    });

    login(
      response.user,
      response.token
    );

    const userRole = response.user.role;
    if (userRole === "SUPER_ADMIN") {
      navigate("/super-admin-dashboard");
    } else if (userRole === "PARTY_ADMIN") {
      navigate("/dashboard");
    } else if (userRole === "SECTOR_OFFICER") {
      navigate("/sector-dashboard");
    } else if (userRole === "BOOTH_COORDINATOR") {
      navigate("/coordinator-dashboard");
    } else {
      navigate("/");
    }
  } catch (error) {
    alert(
      error.response?.data?.message ||
        "Login Failed"
    );
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-6">
          Election War Room
        </h1>

        <input
          type="text"
          placeholder="Mobile Number"
          value={mobileNumber}
          onChange={(e) =>
            setMobileNumber(e.target.value)
          }
          className="w-full border p-3 rounded mb-4"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full border p-3 rounded mb-4"
        />

        <button
  onClick={handleLogin}
  className="w-full bg-blue-600 text-white p-3 rounded"
>
  Login
</button>
      </div>
    </div>
  );
}

export default LoginPage;