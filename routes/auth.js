import express from "express";
import { body } from "express-validator";
import User from "../models/user.js";
import {
  createUser,
  deleteAllUsers,
  deleteUser,
  getUsers,
  importUsers,
  login,
  updateUser,
} from "../controllers/auth.js";
import isAuth from "../middleware/is-auth.js";

const router = express.Router();

router.post(
  "/create-user",
  [
    body("username").custom(async (value) => {
      return await User.findOne({ username: value }).then((user) => {
        if (user) {
          return Promise.reject("Username already exist");
        }
      });
    }),
    body("password")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Password minimum length is 5"),
  ],
  isAuth,
  createUser
);

router.post("/login", login);
router.get("/users", isAuth, getUsers);
router.delete("/delete-user/:userId", isAuth, deleteUser);
router.put(
  "/update-user/:userId",
  [
    body("username").custom(async (value) => {
      return await User.findOne({ username: value }).then((user) => {
        if (user?.length > 1) {
          return Promise.reject("Username already exist");
        }
      });
    }),
  ],
  isAuth,
  updateUser
);
router.post("/import-users", isAuth, importUsers);
router.delete("/delete-all-users", isAuth, deleteAllUsers);

export default router;
