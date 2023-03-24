import { sessionOptions } from "@/lib/session";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {

    const prisma = new PrismaClient();

    const { email, password } = req.body;
    const user = await prisma.user.findUnique({where: {email}});

    if (!user) {
        res.status(401).json({'code': 'NO_USER_EXISTS'});
        return;
    }

    let verified = false;
    try {
        verified = await argon2.verify(user.password, password);
    } catch (e) {
        console.log(e);
        return false;
    }

    if (!verified) {
        res.status(401).json({'code': 'INCORRECT_PASSWORD'});
    }

    req.session.user = {email: user.email, username: user.username, id: user.id, canEdit: user.canEdit, isLoggedIn: true};
    await req.session.save();

    return res.status(200).json({'code': 'OK'});
}

export default withIronSessionApiRoute(handler, sessionOptions);