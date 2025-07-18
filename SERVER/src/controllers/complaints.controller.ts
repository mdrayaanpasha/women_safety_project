import { Request, Response } from 'express';
import { PrismaClient, UserTypes, StatusType } from '../generated/prisma';
import jwt from "jsonwebtoken"
const prisma = new PrismaClient();

export class ComplaintController {

    // File a complaint and dispatch nearest volunteers
    static async createComplaint(req: Request, res: Response): Promise<Response> {
        try {
            const { phoneNo, name, type, description, location } = req.body;

            if (!phoneNo || !type || !location) {
                return res.status(400).json({ error: 'phoneNo, type, and location are required' });
            }

            // Create complaint first
            const complaint = await prisma.complaints.create({
                data: {
                    phoneNo,
                    name,
                    type,
                    description,
                    location
                }
            });

            // Find nearest volunteers for each type
            const legalVolunteer = await ComplaintController.findNearestVolunteer('LEGAL', location);
            const policeVolunteer = await ComplaintController.findNearestVolunteer('POLICE', location);
            const mentalVolunteer = await ComplaintController.findNearestVolunteer('MENTAL', location);

            // Create dispatch
            const dispatch = await prisma.dispatch.create({
                data: {
                    complaintId: complaint.id,
                    legalVolunteerId: legalVolunteer?.id || null,
                    legalVolunteerStatus: "AUTO_DISPATCHED",
                    policeVolunteerId: policeVolunteer?.id || null,
                    policeVolunteerStatus: "AUTO_DISPATCHED",
                    mentalVolunteerId: mentalVolunteer?.id || null,
                    mentalVolunteerStatus: "AUTO_DISPATCHED"
                }
            });

            // Update complaint status
            await prisma.complaints.update({
                where: { id: complaint.id },
                data: { status: StatusType.AUTO_DISPATCHED }
            });

            return res.status(201).json({
                message: 'Complaint filed and volunteers dispatched.',
                complaint,
                dispatch,
                assignedVolunteers: {
                    legalVolunteer,
                    policeVolunteer,
                    mentalVolunteer
                }
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Helper to find nearest volunteer of given type
    private static async findNearestVolunteer(type: UserTypes, location: string) {
        const [lat1, lon1] = location.split(',').map(Number);

        const users = await prisma.users.findMany({
            where: {
                type,
                userStatus: 'ACTIVATED'
            }
        });

        if (users.length === 0) return null;

        // Basic distance calculation (Haversine unnecessary for small datasets)
        let nearest = users[0];
        let minDistance = Number.MAX_VALUE;

        for (const user of users) {
            const [lat2, lon2] = user.location.split(',').map(Number);
            const distance = Math.sqrt(
                Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2)
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearest = user;
            }
        }

        return nearest;
    }


    static async updateVolunteerStatus(req: Request, res: Response): Promise<Response> {
        try {
            const { token, newStatus } = req.body;

            if (!token || !newStatus) {
                return res.status(400).json({ error: 'Token and newStatus are required' });
            }

            if (!Object.values(StatusType).includes(newStatus)) {
                return res.status(400).json({ error: 'Invalid status value' });
            }

            // Decode token
            let decoded: any;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET as string);
            } catch (error) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }

            const userId = decoded.userId;
            const user = await prisma.users.findUnique({
                where: { id: userId }
            });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const userType = user.type;

            // Find dispatch where this volunteer is assigned
            let dispatch = await prisma.dispatch.findFirst({
                where: (() => {
                    switch (userType) {
                        case 'LEGAL':
                            return { legalVolunteerId: userId };
                        case 'POLICE':
                            return { policeVolunteerId: userId };
                        case 'MENTAL':
                            return { mentalVolunteerId: userId };
                        default:
                            return {};
                    }
                })()
            });

            if (!dispatch) {
                return res.status(404).json({ error: 'No dispatch assigned to this volunteer.' });
            }

            const updateData: any = {};
            switch (userType) {
                case 'LEGAL':
                    updateData.legalVolunteerStatus = newStatus;
                    break;
                case 'POLICE':
                    updateData.policeVolunteerStatus = newStatus;
                    break;
                case 'MENTAL':
                    updateData.mentalVolunteerStatus = newStatus;
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid user type.' });
            }

            const updatedDispatch = await prisma.dispatch.update({
                where: { id: dispatch.id },
                data: updateData
            });

            return res.status(200).json({
                message: `${userType} volunteer status updated.`,
                dispatch: updatedDispatch
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }



}
