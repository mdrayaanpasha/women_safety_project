import express from "express";
import cors from "cors";
import userRouter from "./router/user.router";
const app = express();
import jwt from "jsonwebtoken"
import complaintRouter from "./router/complaints.router";
import path from "path"

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/api/user", userRouter);
app.use("/api/complaint", complaintRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {



    console.log(`Server running at http://localhost:${PORT}`);
});
