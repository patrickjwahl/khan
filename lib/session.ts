import type { IronSessionOptions } from 'iron-session';

export const sessionOptions: IronSessionOptions = {
    password: process.env.SECRET_COOKIE_PASSWORD as string,
    cookieName: 'khan-session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production'
    },
    ttl: 60 * 60 * 24 * 365
};


