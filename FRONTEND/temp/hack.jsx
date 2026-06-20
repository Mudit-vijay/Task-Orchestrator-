import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { authService } from "../src/services/api";

function OAuthSuccess() {
  const navigate = useNavigate();
  const { token } = useParams(); // Read from path parameter instead
  
  useEffect(() => {
    const handleOAuth = async () => {
      if (!token) return;
      try {
        localStorage.setItem("token", token);

        const res = await authService.OauthCreation(token);
        const id = res.data.data.id;
        localStorage.removeItem("token");
        localStorage.setItem("token", res.data.data.token);
        navigate(`/taskManager`);
      } catch (err) {
        navigate('/login');
      }
    };
    handleOAuth();
  }, [token, navigate]);
  
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Authentication Successful!</h2>
      <p>Redirecting...</p>
    </div>
  );
}

export default OAuthSuccess;
