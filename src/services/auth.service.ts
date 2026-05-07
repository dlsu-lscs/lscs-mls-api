import jwt from 'jsonwebtoken';
import axios from 'axios';
import { User } from 'dtos/user.dto.js';
import { getUserByUserId, createUser, updateUser } from './user.service.js';

export async function googleAuth2(accessToken: string): Promise<{ jwtString: string, user: User }> {
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

        let user = await getUserByUserId(userInfo.userId);

        if (user) {
            user = (await updateUser(user.uid, userInfo) as User);
        } else {
            user = (await createUser(userInfo) as User);
        }

        const jwtString = jwt.sign(userInfo, process.env.JWT_SECRET as string, {
            expiresIn: '14d',
        }); 

        return { jwtString, user };
    } catch (error) {
        throw new Error ('Error on authentication: ' + (error as Error).message);
    }
}