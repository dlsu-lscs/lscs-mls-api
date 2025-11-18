import express from 'express';
import dotenv from 'dotenv';

import userRouter from 'routes/user.routes.js';
import courseRouter from 'routes/course.routes.js';
import authRouter from 'routes/auth.routes.js'

dotenv.config();
const app = express();
const port = process.env.PORT || 3000; 
const host = process.env.DB_HOST || 'localhost:';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/users', userRouter);
app.use('/courses', courseRouter);
app.use('/auth', authRouter);

app.listen(port, () => {
    console.log(`mls-api is live on port http://${host}:${port}`);
});