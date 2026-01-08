import jwt from 'jsonwebtoken';
import axios from 'axios';
import { User } from 'dtos/user.dto.js';
import { createUser } from './user.service.js';

export async function googleAuth2(accessToken: string): Promise<String> {
    try {
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const { data: payload } = response;

        const userInfo = {
            email: payload.email,
            givenName: payload.given_name,
            familyName: payload.family_name,
            userId: payload.sub,
            pictureUrl: payload.picture
        };

        await createUser(userInfo as User);

        const jwt_token = jwt.sign(userInfo, process.env.JWT_SECRET as string, {
            expiresIn: '14d',
        }); 

        return jwt_token;
    } catch (error) {
        throw new Error ('Error on authentication: ' + (error as Error).message);
    }
}