import jwt from 'jsonwebtoken';
import { User } from '../dtos/user.dto.js';
import { getUserByUserId, createUser, updateUser } from './user.service.js';

export async function googleAuth2(accessToken: string): Promise<{ jwtString: string; user: User }> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error on authentication.');
    }

    const payload = await response.json() as {
      email?: string;
      given_name?: string;
      family_name?: string;
      sub: string;
      picture?: string;
    };

    const userInfo = {
      email: payload.email,
      givenName: payload.given_name,
      familyName: payload.family_name,
      userId: payload.sub,
      pictureUrl: payload.picture,
    };

    let user = await getUserByUserId(userInfo.userId);

    if (user) {
      user = (await updateUser(user.id, userInfo) as User);
    } else {
      user = (await createUser(userInfo) as User);
    }

    const jwtString = jwt.sign(
      userInfo,
      process.env.JWT_SECRET ?? (() => {
        throw new Error('JWT_SECRET not configured');
      })(),
      {
        expiresIn: '14d',
      },
    );

    return { jwtString, user };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Error on authentication.');
  }
}