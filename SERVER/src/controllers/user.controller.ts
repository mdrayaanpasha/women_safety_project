// In UserController.ts

import { Request, Response } from 'express';
import { PrismaClient, UserTypes, UserStatus } from '../generated/prisma';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken"
import { config } from 'dotenv';
config(); // Load .env variables at the start


import crypto from 'crypto';
import nodemailer from 'nodemailer';

// After creating user (inside registerUser)
const activationToken = crypto.randomBytes(32).toString('hex');




const prisma = new PrismaClient();

export class UserController {

    static async registerUser(req: any, res: Response): Promise<Response> {
        try {
            const { email, name, password, type, location, phone } = req.body;

            if (!email || !name || !password || !type) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Handle filePath from multer upload if exists
            let filePath = '';
            if (req.file) {
                filePath = `/uploads/${req.file.filename}`;
            } else if (req.body.filePath) {
                filePath = req.body.filePath;
            }

            const newUser = await prisma.users.create({
                data: {
                    email,
                    name,
                    location,
                    password, // Hash in production
                    type: type as UserTypes,
                    mobile: phone,
                    filePath,
                    userStatus: UserStatus.INPROGRESS
                }
            });

            return res.status(201).json(newUser);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getUser(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;

            const user = await prisma.users.findUnique({
                where: { id: parseInt(id, 10) }
            });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            return res.status(200).json(user);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    // In UserController.ts

    static async getUsersPendingVerification(req: Request, res: Response): Promise<Response> {
        try {
            const { adminPassword } = req.body;

            if (!adminPassword) {
                return res.status(400).json({ error: 'Admin password is required.' });
            }

            if (adminPassword !== process.env.ADMIN_SECRET) {
                return res.status(401).json({ error: 'Unauthorised: Incorrect admin password.' });
            }

            const users = await prisma.users.findMany({
                where: { userStatus: 'INPROGRESS' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    type: true,
                    location: true,
                    createdAt: true,
                    filePath: true
                }
            });

            return res.status(200).json({
                message: 'Users pending verification fetched successfully.',
                count: users.length,
                users
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error.' });
        }
    }

    static async loginUser(req: Request, res: Response): Promise<Response> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Missing email or password' });
            }

            const user = await prisma.users.findUnique({
                where: { email }
            });


            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            if (user.userStatus === "INPROGRESS") {

                return res.status(402).json({ message: "you are still not verified" })
            }
            if (user.userStatus === "BANNED") {
                return res.status(401).json({ message: "you are banned on our platform" })
            }
            if (user.userStatus === "VERIFIED") {
                return res.status(403).json({ message: "check your email for verification you havent clicked our verification link yet" })
            }

            // Compare password (assuming hashed)
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            const token = jwt.sign(
                { userId: user.id, userType: user.type },
                process.env.JWT_SECRET as string,
                { expiresIn: '7d' }  // token valid for 7 days
            );
            // For simplicity, return user (without password)
            const { password: _, ...userWithoutPassword } = user;

            return res.status(200).json({
                message: 'Login successful',
                user: userWithoutPassword
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async verifyUser(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const { adminPassword } = req.body;

            if (!adminPassword) {
                return res.status(400).json({ error: 'Admin password required' });
            }

            if (adminPassword !== process.env.ADMIN_SECRET) {
                return res.status(401).json({ error: 'Unauthorized: Incorrect password' });
            }

            const user = await prisma.users.findFirst({
                where: {
                    id: parseInt(id, 10)
                }
            })
            if (!user) {
                return res.status(404).json({ message: "user not found" })
            }
            // Generate JWT token containing user ID
            const token = jwt.sign(
                { userId: parseInt(id, 10), userType: user.type },
                process.env.JWT_SECRET as string,
                { expiresIn: '7d' }  // token valid for 7 days
            );
            // Update user status to VERIFIED (optional to store token)
            const updatedUser = await prisma.users.update({
                where: { id: parseInt(id, 10) },
                data: {
                    userStatus: UserStatus.VERIFIED,
                    activationToken: token
                }
            });

            // Prepare activation link (could be a frontend dashboard link)
            const activationLink = `${process.env.FRONTEND_URL}/activate/${token}`;

            // Send email
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: updatedUser.email,
                subject: 'Welcome! Activate Your Account Access',
                html: `<p>Hello ${updatedUser.name},</p>
                   <p>Your account has been verified by admin.</p>
                   <p>Click <a href="${activationLink}">here</a> to get started.</p>`
            };

            await transporter.sendMail(mailOptions);

            return res.status(200).json({
                message: 'User verified and activation email sent.',
                user: updatedUser
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async rejectUser(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const { adminPassword } = req.body;

            if (!adminPassword) {
                return res.status(400).json({ error: 'Admin password required' });
            }

            if (adminPassword !== process.env.ADMIN_SECRET) {
                return res.status(401).json({ error: 'Unauthorized: Incorrect password' });
            }

            const user = await prisma.users.findFirst({
                where: { id: parseInt(id, 10) }
            });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            if (user.userStatus === 'BANNED') {
                return res.status(400).json({ message: 'User is already banned.' });
            }

            const bannedUser = await prisma.users.update({
                where: { id: parseInt(id, 10) },
                data: {
                    userStatus: UserStatus.BANNED
                }
            });

            return res.status(200).json({
                message: 'User has been banned successfully.',
                user: bannedUser
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }


    static async activateUser(req: Request, res: Response): Promise<Response> {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({ error: 'Activation token is required' });
            }

            // Verify & decode JWT
            let decoded: any;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET as string);
            } catch (error) {
                return res.status(400).json({ error: 'Invalid or expired activation token' });
            }

            const userId = decoded.userId;

            // Confirm user exists & token matches
            const user = await prisma.users.findUnique({
                where: { id: userId }
            });

            if (!user || user.activationToken !== token) {
                return res.status(404).json({ error: 'Invalid activation request' });
            }

            // Update user status to ACTIVATED & clear token
            const activatedUser = await prisma.users.update({
                where: { id: userId },
                data: {
                    userStatus: UserStatus.ACTIVATED,  // Replace with your enum’s activated value
                    activationToken: null              // Clear token after activation
                }
            });

            return res.status(200).json({
                message: 'Account activated successfully.',
                user: activatedUser
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async checkAssignedComplaint(req: Request, res: Response): Promise<Response> {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({ error: 'Token is required.' });
            }

            let decoded: any;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET as string);
            } catch (error) {
                return res.status(401).json({ error: 'Invalid or expired token.' });
            }

            const userId = decoded.userId;

            const user = await prisma.users.findUnique({
                where: { id: userId }
            });

            if (!user) {
                return res.status(404).json({ error: 'User not found.' });
            }

            const userType = user.type;

            // Build dynamic filter based on userType
            const statusField =
                userType === UserTypes.LEGAL ? 'legalVolunteerStatus' :
                    userType === UserTypes.POLICE ? 'policeVolunteerStatus' :
                        userType === UserTypes.MENTAL ? 'mentalVolunteerStatus' : null;

            const volunteerIdField =
                userType === UserTypes.LEGAL ? 'legalVolunteerId' :
                    userType === UserTypes.POLICE ? 'policeVolunteerId' :
                        userType === UserTypes.MENTAL ? 'mentalVolunteerId' : null;

            if (!statusField || !volunteerIdField) {
                return res.status(400).json({ error: 'Invalid user type.' });
            }

            // Fetch all dispatches where the volunteer is assigned and status != RESOLVED or CLOSED
            const dispatches = await prisma.dispatch.findMany({
                where: {
                    [volunteerIdField]: userId,
                    NOT: {
                        [statusField]: { in: ['RESOLVED', 'CLOSED'] }
                    }
                },
                include: {
                    complaint: true
                }
            });
            // console.log(dispatches)

            if (dispatches.length === 0) {
                return res.status(200).json({
                    message: 'No active complaints assigned to this volunteer.',
                    complaints: []
                });
            }

            // Map dispatches into a clean response
            const complaints = dispatches.map(dispatch => {
                let volunteerStatus = dispatch[statusField];

                return {
                    complaintId: dispatch.complaint.id,
                    complainantName: dispatch.complaint.name || 'Anonymous',
                    complainantPhone: dispatch.complaint.phoneNo,
                    type: dispatch.complaint.type,
                    description: dispatch.complaint.description,
                    location: dispatch.complaint.location,
                    status: dispatch.complaint.status,
                    reportedAt: dispatch.complaint.reportedAt,
                    volunteerStatus,
                    dispatchId: dispatch.id,
                    dispatchCreatedAt: dispatch.createdAt
                };
            });

            return res.status(200).json({
                message: 'Active complaints assigned to volunteer fetched successfully.',
                complaints
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error.' });
        }
    }


}
