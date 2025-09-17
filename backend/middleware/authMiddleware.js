const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader); // Debug log

    // check if header exists and starts with "Bearer"
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log('No token provided in authorization header');
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1];
    console.log('Token extracted:', token ? 'exists' : 'missing'); // Debug log

    if (!token) {
      console.log('Token is empty after extraction');
      return res.status(401).json({ message: "Invalid token format" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully:', { userId: decoded.id }); // Debug log
      req.user = decoded; // attach user data (id, email) to request
      next(); // move to next route
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return res.status(401).json({ message: "Invalid token", error: jwtError.message });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: "Server error in authentication" });
  }
};

module.exports = authMiddleware;
