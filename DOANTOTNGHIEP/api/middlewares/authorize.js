import jwt from "jsonwebtoken";

export const authorize = (req, res, next) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };
    next();
  } catch {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
