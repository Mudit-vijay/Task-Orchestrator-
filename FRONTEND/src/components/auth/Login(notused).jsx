import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/api";
import { Formik, Form, Field } from "formik";
import { useDispatch } from "react-redux";
import {
  setName,
  setEmail,
  setPassword,
} from "../../../features/auth/auth-slice";
import { setUserId } from "../../../features/userID/userId-slics";

const LoginSignup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  // ----- LOGIN -----
  const handleLogin = async (values) => {
    console.log(values + "values")
    const { email, password } = values;
    if (!email || !password) {
      alert("Please fill in all login fields");
      return;
    }

    dispatch(setEmail(email));
    dispatch(setPassword(password));

    setIsLoading(true);
    try {
      console.log(values + "testing whole action")
      const result = await authService.login(values, { withCredentials: true });
      console.log("auth");
      console.log(result);
      const { user } = result;
      dispatch(setUserId(user._id));
      navigate("/taskManager");
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
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
    dispatch(setPassword(password));

    setIsLoading(true);
    try {
      await authService.createUser(values, { withCredentials: true });
      alert("User created successfully!");
    } catch (err) {
      console.error("Signup error:", err);
      alert("Failed to create user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ----- Styling -----
  const inputClasses =
    "w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-md p-3 text-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300";

  const buttonClasses =
    "w-full text-white py-2 rounded-md text-lg mt-3 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* --- LOGIN CARD --- */}
        <div className="bg-gray-800 shadow-xl rounded-xl p-8 flex flex-col justify-center items-center transition-all duration-500 hover:shadow-2xl">
          <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">
            Welcome Back 👋
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Login to your Task Manager
          </p>

          <Formik
            initialValues={{ email: "", password: "" }}
            onSubmit={handleLogin}
          >
            {() => (
              <Form className="w-full">
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
                  placeholder="Password"
                  className={inputClasses}
                  disabled={isLoading}
                />

                <button
                  type="submit"
                  className={buttonClasses + " bg-blue-600 hover:bg-blue-700"}
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </button>
              </Form>
            )}
          </Formik>

          <div className="mt-6 w-full text-center border-t border-gray-600 pt-4">
            <h3 className="text-gray-400 mb-3">Or sign in with</h3>
            <button
              className="bg-white text-black px-6 py-2 rounded-md transition hover:bg-gray-200"
              disabled={isLoading}
            >
              Google
            </button>
          </div>
        </div>

        {/* --- SIGNUP CARD --- */}
        <div className="bg-gray-800 shadow-xl rounded-xl p-8 flex flex-col justify-center items-center transition-all duration-500 hover:shadow-2xl">
          <h2 className="text-3xl font-bold mb-6 text-center text-green-400">
            Create an Account
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Start organizing your tasks
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
                  placeholder="Name"
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
                  placeholder="Password"
                  className={inputClasses}
                  disabled={isLoading}
                />

                <button
                  type="submit"
                  className={buttonClasses + " bg-green-600 hover:bg-green-700"}
                  disabled={
                    isLoading ||
                    !values.name.trim() ||
                    !values.email.trim() ||
                    !values.password.trim()
                  }
                >
                  {isLoading ? "Creating..." : "Create Account"}
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;


