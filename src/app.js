import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config({
    path: "./.env"
});

const app = express()
const port = process.env.PORT || 3000;

//basic configurations
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));

//cors configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));


//import the routes
import healthCheckRouter from './routes/healthcheck.routes.js';

app.use("/api/v1/healthcheck",healthCheckRouter)


app.get("/", (req, res) => {
    res.send("Hello World!");
})



export default app;