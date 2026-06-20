/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/api";
import { Formik, Form, Field } from "formik";
import { useDispatch } from "react-redux";
import { setName, setEmail } from "../../../features/auth/auth-slice";
import { setUserId } from "../../../features/userID/userId-slics";

const LoginSignup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingg, setIsLoadingg] = useState(false);

  // ----- LOGIN -----
  const handleLogin = async (values) => {
    const { email, password } = values;
    if (!email || !password) {
      alert("Please fill in all login fields");
      return;
    }
    setIsLoadingg(true);
    try {
      const res = await authService.login(values.email, values.password);
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
      dispatch(setEmail(email));
      dispatch(setName(res.data.name));
      dispatch(setUserId(res.data._id));
      navigate(`/taskManager`);
    } catch (err) {
      alert("Login failed. Please check your credentials or try again after some time.");
    } finally {
      setIsLoadingg(false);
    }
  };

  // ----- SIGNUP -----
  const handleSignup = async (values) => {
    const { name, email, password } = values;
    if (!name || !email || !password) {
      alert("Please fill in all signup fields");
      return;
    }
    dispatch(setName(name));
    dispatch(setEmail(email));
    setIsLoading(true);
    try {
      const res = await authService.createUser(values);
      if (res && res.token) {
        localStorage.setItem("token", res.token);
        dispatch(setName(name));
        dispatch(setEmail(email));
        dispatch(setUserId(res._id));
        navigate(`/phase2/${res._id}`);
      } else {
        navigate(`/verify-otp/${res._id || 'verify'}`);
      }
    } catch (err) {
      alert("Failed to create user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoogleLogin = async () => {
    window.location.href =
      import.meta.env.VITE_OAUTH_GOOGLE_URL || "https://oauth-service-fyrc.onrender.com/api/stateless-oauth/google";
  };

  // ----- Styling -----
  const inputClasses =
    "w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-xl p-4 text-lg mb-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300 shadow-sm";

  const buttonClasses =
    "w-full text-white py-3 rounded-xl text-lg mt-4 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md";

  const googleButtonClasses =
    "w-full bg-white text-gray-900 px-5 py-3 rounded-xl flex items-center justify-center space-x-3 font-semibold transition hover:bg-gray-200 shadow-md transform hover:-translate-y-0.5 active:translate-y-0";

  return (
<div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-gray-950 to-gray-800 text-white p-6 font-sans">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* --- LOGIN CARD --- */}
        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm shadow-2xl rounded-3xl p-10 flex flex-col items-center transition-transform duration-500 hover:scale-[1.02] hover:shadow-3xl border border-gray-700">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-indigo-400 text-center tracking-tight">
            Welcome Back! 👋
          </h2>
          <p className="text-gray-300 mb-6 text-center text-lg leading-relaxed">
            Login to your Task Manager and continue where you left off.
          </p>

          <Formik
            initialValues={{ email: "", password: "", OTP: "" }}
            onSubmit={handleLogin}
          >
            {({ values }) => (
              <Form className="w-full">
                <Field
                  type="email"
                  name="email"
                  placeholder="Email"
                  className={inputClasses}
                  disabled={isLoadingg}
                />
                <Field
                  type="password"
                  name="password"
                  placeholder="Password"
                  className={inputClasses}
                  disabled={isLoadingg}
                />

                <button
                  type="submit"
                  className={
                    buttonClasses + " bg-indigo-600 hover:bg-indigo-700"
                  }
                  disabled={isLoadingg}
                >
                  {isLoadingg ? "Logging in..." : "Login"}
                </button>
              </Form>
            )}
          </Formik>

          <div className="mt-6 w-full text-center border-t border-gray-700 pt-6">
            <h3 className="text-gray-300 mb-4 text-md font-semibold">
              Or connect with
            </h3>
            <button
              className={googleButtonClasses}
              disabled={isLoadingg || isLoading}
              onClick={handleGoogleLogin}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png"
                alt="Google logo"
                className="h-6 w-6"
              />
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>

        {/* --- SIGNUP CARD --- */}
        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-sm shadow-2xl rounded-3xl p-10 flex flex-col items-center transition-transform duration-500 hover:scale-[1.02] hover:shadow-3xl border border-gray-700">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-teal-400 text-center tracking-tight">
            Create Your Account
          </h2>
          <p className="text-gray-300 mb-6 text-center text-lg leading-relaxed">
            Join the Task Manager community and boost your productivity.
          </p>

          <Formik
            initialValues={{ name: "", email: "", password: "" }}
            onSubmit={handleSignup}
          >
            {({ values }) => (
              <Form className="w-full">
                <Field
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  className={inputClasses}
                  disabled={isLoading}
                />
                <Field
                  type="email"
                  name="email"
                  placeholder="Email"
                  className={inputClasses}
                  disabled={isLoading}
                />
                <Field
                  type="password"
                  name="password"
                  placeholder="Create Password"
                  className={inputClasses}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className={buttonClasses + " bg-teal-600 hover:bg-teal-700"}
                  disabled={
                    isLoading ||
                    !values.name.trim() ||
                    !values.email.trim() ||
                    !values.password.trim()
                  }
                >
                  {isLoading ? "Creating Account..." : "Sign Up"}
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>

      <div className="mt-10 max-w-4xl mx-auto">
        <div className="bg-gray-900/40 border border-gray-700 rounded-xl px-5 py-4 text-center">
          <p className="text-sm text-gray-400 leading-relaxed">
            <span className="font-semibold text-gray-300">Note:</span>{" "}
            This project is hosted on free-tier cloud servers. Services may
            occasionally take 3–5 minutes to start if they have been inactive.
            Since the application follows a microservices architecture, each
            service starts independently and may require additional time to
            become available. If the application does not respond immediately,
            please allow a few minutes for all services to initialize before
            assuming that the project is not working.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;
