import express from 'express';
import {} from './routes/user.routes.js';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000; 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(/* router */);

app.listen(port, () => {
    console.log(`mls-api is live on port ${port}`);
});