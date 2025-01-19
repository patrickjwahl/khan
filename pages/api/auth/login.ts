import { prisma } from "@/lib/db";
import { sessionOptions } from "@/lib/session";
import argon2 from "argon2";
import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiRequest, NextApiResponse } from "next";

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

async function handler(req: NextApiRequest, res: NextApiResponse) {

    await new Promise(r => setTimeout(r, 10000))

    const { username, password } = req.body;
    const emailUser = await prisma.user.findFirst({where: {email: username}});
    const unameUser = await prisma.user.findFirst({where: {username: username}});

    const user = emailUser || unameUser;

    if (!user) {
        return res.json({'code': 'NO_USER_EXISTS'});
    }

    let verified = false;
    try {
        verified = await argon2.verify(user.password, password);
    } catch (e) {
        console.log(e);
        return false;
    }

    if (!verified) {
        return res.status(401).json({'code': 'INCORRECT_PASSWORD'});
    }

    req.session.user = {email: user.email, username: user.username, id: user.id, canEdit: user.canEdit, isLoggedIn: true};
    await req.session.save();

    return res.status(200).json({'code': 'OK'});
}

export default withIronSessionApiRoute(handler, sessionOptions);