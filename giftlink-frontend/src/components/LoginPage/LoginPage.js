import { useState, useEffect } from "react";
import "./LoginPage.css";
import { urlConfig } from "../../config";
import { useAppContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [incorrect, setIncorrect] = useState();
  const navigate = useNavigate();
  const bearerToken = sessionStorage.getItem("bearer-token");
  const { setIsLoggedIn } = useAppContext();

  useEffect(() => {
    if (sessionStorage.getItem("auth-token")) {
      navigate("/app");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/auth/login`, {
      method: "POST",
      header: { "content-type": "application/json" },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const json = await res.json();

    if (json.authtoken) {
      const json = await res.json();
      sessionStorage.setItem("auth-token", json.authtoken);
      sessionStorage.setItem("name", json.name);
      sessionStorage.setItem("email", json.email);
      setIsLoggedIn(true);
      navigate("/app");
    } else {
      document.getElementById("email").value("");
      document.getElementById("password").value("");
      setIncorrect("Wrong password.Try again.");
      setTimeout(() => {
        setTimeout();
      }, 2000);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="login-card p-4 border rounded">
            <h2 className="text-center mb-4 font-weight-bold">Login</h2>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="text"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary w-100 mb-3"
              onClick={handleLogin}
            >
              Login
            </button>
            <p className="mt-4 text-center">
              New here?{" "}
              <a href="/app/register" className="text-primary">
                Register Here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
