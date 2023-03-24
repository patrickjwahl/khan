import { sessionOptions } from '@/lib/session';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {

    const prisma = new PrismaClient();

    const { email, password, username } = req.body;
    const hashedPassword = await argon2.hash(password);
    await prisma.user.create({data: {
        email, password: hashedPassword, username
    }});

    req.session.user = { email, isLoggedIn: true};
    await req.session.save();

    return res.status(200).json({'we': 'did it'});
}

export default withIronSessionApiRoute(handler, sessionOptions);