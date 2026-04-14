// src/routes/upload.routes.js (ESM)
import { Router } from "express";
import upload from "../middleware/upload.js";
import { auth } from "../middleware/auth.js";

const router = Router();

// Upload receipt image
// POST /api/uploads/receipt
router.post(
  "/receipt",
  auth(["TENANT", "ADMIN"]),
  upload.single("receipt"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Return the file URL
      const fileUrl = `/uploads/receipts/${req.file.filename}`;

      return res.status(200).json({
        success: true,
        data: {
          url: fileUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
        },
      });
    } catch (err) {
      console.error("Upload error:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to upload file",
      });
    }
  }
);

export default router;
