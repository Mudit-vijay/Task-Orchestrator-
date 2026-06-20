import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    console.log("request received");
    console.log(req.body);
    console.log(req.cookies);
    const token = req.cookies?.token;
    console.log(token)
    if (!token) return res.status(401).json({ msg: "No token found" });

    try {
        const decoded = jwt.verify(token, process.env.JWT);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ msg: "Invalid token" });
    }
};

export default authMiddleware;

