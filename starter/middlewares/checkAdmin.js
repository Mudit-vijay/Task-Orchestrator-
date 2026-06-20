import jwt from "jsonwebtoken";

const checkAdmin = (req, res, next) => {
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];
    
    if (!token) return res.status(401).json({ msg: "No token found" });

    try {
        const decoded = jwt.verify(token, process.env.JWT);
        if (decoded.role !== 'ADMIN') {
            return res.status(403).json({ msg: "Access denied. Admin only." });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ msg: "Invalid token" });
    }
};

export default checkAdmin;
