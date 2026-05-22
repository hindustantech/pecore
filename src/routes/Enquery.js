import express from "express";
import { createEnquery } from "../controllers/Enquery.js";
const router = express.Router();

router.post("/createEnquery", createEnquery);

export default router;
