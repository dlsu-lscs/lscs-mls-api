import type { Request, Response } from 'express';
import axios from 'axios';
import * as AuthService from '../services/auth.service.js';

export const handleAuthentication = async function (req: Request,  res: Response): Promise<undefined> {
    const { token: accessToken } = req.body;    

    try {
        const result = await AuthService.googleAuth2(accessToken);
        res.status(200).json(result);
    } catch (error: any) {
        console.error({ error: (error as Error).message });
        if (error.message.includes('Error on authentication')) {
            res.status(403).json({ error: (error as Error).message });
        } else {
            res.status(500).json({ error: (error as Error).message });
        }
    }
};

export const handleCallback = async function (req: Request, res: Response): Promise<undefined> {
    const { code } = req.query;

    try {
        if (!code) {
            res.status(400).json({ error: 'Authorization code is missing' });
            return;
        }

        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            code: code as string,
            grant_type: 'authorization_code',
            redirect_uri: process.env.GOOGLE_REDIRECT_URI
        });

        const { id_token } = tokenResponse.data;

        const result = await AuthService.googleAuth2(id_token);
        
        res.status(200).json({ token: result });
    } catch (error: any) {
        console.error({ error: (error as Error).message });
        if (error.message.includes('Error on authentication')) {
            res.status(403).json({ error: (error as Error).message });
        } else {
            res.status(500).json({ error: (error as Error).message });
        }
    }
};