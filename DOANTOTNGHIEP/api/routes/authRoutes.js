import express from "express";
import {
  changePassword,
  login,
  logout,
  register,
} from "../controllers/Auth/authController.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.put("/change-password", authorize, changePassword);

router.get("/check", authorize, (req, res) => {
  res.status(200).json({ message: "OK", user: req.user });
});

router.post("/logout", logout);

export default router;
