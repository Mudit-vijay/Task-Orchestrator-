import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/authentication/Login";
import Dashboard from "../temp/phase_ii_ui";
import GroupView from "../temp/groupView";
import ProtectedRoute from "./ProtectedRoute";
import "./App.css";
import OAuthSuccess from "../temp/hack";
import Otpverification from "./components/auth/Otpverification.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/oauth-success/:token" element={<OAuthSuccess />} />
          <Route path="/verify-otp/:id" element={<Otpverification />} />
          <Route
            path="/taskManager"
            element={<Dashboard />}
          />
          <Route
            path="/group/:id"
            element={<GroupView />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
