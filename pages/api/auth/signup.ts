import { prisma } from '@/lib/db';
import { sessionOptions } from '@/lib/session';
import argon2 from 'argon2';
import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';

declare module "iron-session" { 
    interface IronSessionData { 
        user?: {
            email: string,
            username: string,
            id: number,
            canEdit: boolean,
            isLoggedIn: boolean
        }
    } 
}

const validateEmail = (email: string) => {

    return String(email)
        .toLowerCase()
        .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
};

const validatePassword = (password: string) => {
    return String(password)
        .match(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/);
};

const validateUsername = (username: string) => {
    return String(username).match(/^[a-zA-Z0-9_-]*$/);
};

async function handler(req: NextApiRequest, res: NextApiResponse) {

    const { email, password, username } = req.body;

    let validationErrors = [];

    if (!email || !validateEmail(email)) {
        validationErrors.push('email');
    }

    if (!password || password.length < 8) {
        validationErrors.push('password_length');
    } else if (!validatePassword(password)) {
        validationErrors.push('password_strength');
    }

    if (!username || !validateUsername(username)) {
        validationErrors.push('username');
    }

    if (validationErrors.length > 0) {
        return res.json({code: 'VALIDATION_ERRORS', errors: validationErrors});
    }

    let matchingErrors = [];

    const existingEmail = await prisma.user.findFirst({where: {email: email}});
    if (existingEmail) {
        matchingErrors.push('email');
    }

    const existingUsername = await prisma.user.findFirst({where: {username: username}});
    if (existingUsername) {
        matchingErrors.push('username');
    }

    if (matchingErrors.length > 0) {
        return res.json({code: 'MATCHING_ERRORS', errors: matchingErrors});
    }

    const hashedPassword = await argon2.hash(password);
    const user = await prisma.user.create({data: {
        email, password: hashedPassword, username, canEdit: true
    }});

    req.session.user = {
        email: user.email,
        username: user.username, 
        id: user.id, 
        canEdit: user.canEdit, 
        isLoggedIn: true
    };
    
    await req.session.save();

    return res.status(200).json({code: 'OK'});
}

export default withIronSessionApiRoute(handler, sessionOptions);