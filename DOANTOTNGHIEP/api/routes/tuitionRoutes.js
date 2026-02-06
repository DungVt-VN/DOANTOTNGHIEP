import express from "express";
import {
  getAllPayments,
  createPayment,
  updatePayment,
  updatePaymentStatus,
  getTuitionDebts,
} from "../controllers/Tuition/tuitionController.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.get("/all", authorize, getAllPayments);
router.post("/create", authorize, createPayment);
router.put("/:id", authorize, updatePayment);
router.put("/:id/status", authorize, updatePaymentStatus);
router.get("/debts", getTuitionDebts);

export default router;
