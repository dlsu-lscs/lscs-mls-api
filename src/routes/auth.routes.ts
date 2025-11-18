import { Router } from "express";
import * as AuthController from 'controllers/auth.controller.js';

const router = Router();

router.post('/google', AuthController.handleAuthentication);
router.get('/google/callback', AuthController.handleCallback);

export default router;