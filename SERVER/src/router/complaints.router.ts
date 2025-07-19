import { Router } from "express";
import { ComplaintController } from "../controllers/complaints.controller";

const complaintRouter = Router()

complaintRouter.get("/create-fictional-volunteers", ComplaintController.createFictionalVolunteers);
complaintRouter.delete("/fictional-volunteers", ComplaintController.deleteAll);
complaintRouter.post("/createComplaint", ComplaintController.createComplaint);
complaintRouter.post("/updateVolunteers", ComplaintController.updateVolunteerStatus);
complaintRouter.post("/getComplaintDetailsWithVolunteers/:complaintId", ComplaintController.getComplaintDetailsWithVolunteers);

export default complaintRouter;


