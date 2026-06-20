import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { authService } from "../../services/api";
import { useDispatch } from "react-redux";
import { setName } from "../../../features/auth/auth-slice";
import { setUserId } from "../../../features/userID/userId-slics";
const OtpVerification = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // const otp = useSelector((state) => state.otp.otp);
  const email = useSelector((state) => state.auth.email);
  const [OTP, setOTP] = useState(""); // user input
  const id = useSelector((sate) => sate);
  const verifyOTP = async () => {

    const res = await authService.otpVerification(OTP, email);
    const data = res.data;
    dispatch(setName(data.data.name));
    dispatch(setUserId(data.data._id));

    if (data.msg == "OTP Verification Successfull") {
      if (res.status === 200) {
      navigate("/taskManager");
    }
    } else {
      return (
        <>
          <h1 className="justify-center itmes-center text-red-600">
            you have entered wrong otp
          </h1>
        </>
      );
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 p-6">
      <div className="bg-gray-800 rounded-2xl shadow-xl p-10 w-full max-w-md flex flex-col items-center">
        <h1 className="text-3xl font-bold text-blue-400 mb-4 text-center">
          OTP Verification
        </h1>
        <p className="text-gray-400 mb-6 text-center">
          Please enter the 6-digit OTP sent to your email.
        </p>

        <input
          type="text"
          name="OTP"
          value={OTP}
          onChange={(e) => setOTP(e.target.value)}
          placeholder="Enter OTP"
          className="w-full px-4 py-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg mb-4"
        />

        <button
          onClick={verifyOTP}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md text-lg transition-transform transform hover:scale-105 mb-4"
        >
          Verify OTP
        </button>

        <p className="text-gray-400 text-sm text-center">
          Didn't receive the OTP? Check your spam folder or{" "}
          <span className="text-blue-400 cursor-pointer underline">
            resend OTP
          </span>
          .
        </p>
      </div>
    </div>
  );
};

export default OtpVerification;
