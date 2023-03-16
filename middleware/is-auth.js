import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({ path: "/.env" });

export default (req, res, next) => {
  // Authorizaton : Bearer "TOKEN"
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader.split(" ")[1];
  let decodedToken;

  try {
    decodedToken = jwt.verify(token, process.env.SECRET_KEY);
  } catch (error) {
    error.statusCode = 500;
    throw error;
  }

  if (!decodedToken) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    throw error;
  }
  req.userId = decodedToken.userId;
  req.role = decodedToken?.role;
  req.department = decodedToken?.department;
  req.employee_id = decodedToken?.employee_id;
  next();
};
