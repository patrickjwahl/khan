import { sessionOptions } from "@/lib/session";
import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiRequest, NextApiResponse } from "next";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    req.session.destroy();
    return res.status(200);
}

export default withIronSessionApiRoute(handler, sessionOptions);