// userRouter.ts

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { UserController } from '../controllers/user.controller';

const userRouter = express.Router();

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Route: POST /user/register (with image upload + user data)
userRouter.post('/register', upload.single('image'), UserController.registerUser);
userRouter.post('/login', UserController.loginUser);
userRouter.post('/verify/:id', UserController.verifyUser);
userRouter.post('/reject/:id', UserController.rejectUser);

userRouter.post('/pending-verifications', UserController.getUsersPendingVerification);
userRouter.post('/activate', UserController.activateUser);
userRouter.post('/check-dispatch', UserController.checkAssignedComplaint);


export default userRouter;
