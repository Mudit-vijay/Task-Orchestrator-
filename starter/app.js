import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import connectdb from "./db/connect.js";
import groupRouter from "./routes/groups.js";
import taskRouter from "./routes/task.js";

dotenv.config();

const app = express();

app.use(helmet());
app.use(compression());

// CORS origins from environment variable (comma-separated)
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

// middleware
app.use(express.static("./public"));
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/task", taskRouter);
app.use("/api/v1/group", groupRouter);

const port = process.env.PORT || 9000;
const start = async () => {
    try {
        await connectdb(process.env.MONGO_URI);
        app.listen(port, () => {
            console.log(`server is listening on port ${port}`);
        });
    } catch (err) {
        console.log(err);
    }
};

start();
