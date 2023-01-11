import express from "express";
import session from "express-session";
import connectRedis from "connect-redis";
import Redis from "ioredis";
import { createConnection } from "typeorm";
import { login, register, logout } from "./repo/UserRepo";
import { createThread, getThreadsByCategoryId } from "./repo/ThreadRepo";
import {
    createThreadItem,
    getThreadItemsByThreadId,
} from "./repo/ThreadItemRepo";

require("dotenv").config();

const main = async () => {
    const app = express();
    const router = express.Router();

    await createConnection();

    const redis = new Redis({
        port: Number(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
    });

    const RedisStore = connectRedis(session);
    const redisStore = new RedisStore({
        client: redis,
    });

    app.use(express.json());

    app.use(
        session({
            store: redisStore,
            name: process.env.COOKIE_NAME,
            sameSite: "Strict",
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: {
                path: "/",
                httpOnly: true,
                secure: false,
                maxAge: 1000 * 60 * 60 * 24,
            },
        } as any)
    );
    app.use(router);

    router.get("/", (req, res, next) => {
        if (!req.session!.userid) {
            req.session!.userid = req.query.userid;
            console.log("Userid is set");
            req.session!.loadedCount = 0;
        } else {
            req.session!.loadedCount = Number(req.session!.loadedCount) + 1;
        }
        console.log(req.session!.loadedCount);
        res.send(
            `userid: ${req.session!.userid}, loadedCount: ${
                req.session!.loadedCount
            }`
        );
    });

    router.post("/register", async (req, res, next) => {
        try {
            console.log("params", req.body);
            const { email, userName, password } = req.body;
            const userResult = await register(email, userName, password);

            if (userResult && userResult.user) {
                res.send(
                    `Utworzono nowego użytkownika o identyfikatorze ${userResult.user.id}`
                );
            } else if (userResult && userResult.messages) {
                res.send(userResult.messages[0]);
            } else {
                next();
            }
        } catch (ex) {
            res.send(ex.message);
        }
    });

    router.post("/login", async (req, res, next) => {
        try {
            console.log("params", req.body);
            const userResult = await login(
                req.body.userName,
                req.body.password
            );
            if (userResult && userResult.user) {
                req.session!.userId = userResult.user?.id;
                res.send(`user logged in, userId: ${req.session!.userId}`);
            } else if (userResult && userResult.messages) {
                res.send(userResult.messages[0]);
            } else {
                next();
            }
        } catch (ex) {
            res.send(ex.message);
        }
    });

    router.post("/createthread", async (req, res, next) => {
        try {
            console.log("userId", req.session);
            console.log("body", req.body);
            const { categoryId, body, title } = req.body;
            const msg = await createThread(
                req.session!.userId,
                categoryId,
                title,
                body
            );
            res.send(msg);
        } catch (ex) {
            console.log(ex);
            res.send(ex.message);
        }
    });

    router.post("/logout", async (req, res, next) => {
        try {
            console.log("params", req.body);
            const msg = await logout(req.body.userName);
            if (msg) {
                req.session!.userId = null;
                res.send(msg);
            } else {
                next();
            }
        } catch (ex) {
            console.log(ex);
            res.send(ex.message);
        }
    });

    router.post("/threadsbycategory", async (req, res, next) => {
        try {
            const threadResult = await getThreadsByCategoryId(
                req.body.categoryId
            );
            if (threadResult && threadResult.entities) {
                let items = "";
                threadResult.entities.forEach((th) => {
                    items += th.title + ", ";
                });
                res.send(items);
            } else if (threadResult && threadResult.messages) {
                res.send(threadResult.messages[0]);
            }
        } catch (ex) {
            console.log(ex.message);
            res.send(ex.message);
        }
    });

    router.post("/createthreaditem", async (req, res, next) => {
        try {
            const msg = await createThreadItem(
                req.session!.userId, // notice this is from session!
                req.body.threadId,
                req.body.body
            );

            res.send(msg);
        } catch (ex) {
            console.log(ex);
            res.send(ex.message);
        }
    });
    router.post("/threadsitemsbythread", async (req, res, next) => {
        try {
            const threadItemResult = await getThreadItemsByThreadId(
                req.body.threadId
            );

            if (threadItemResult && threadItemResult.entities) {
                let items = "";
                threadItemResult.entities.forEach((ti) => {
                    items += ti.body + ", ";
                });
                res.send(items);
            } else if (threadItemResult && threadItemResult.messages) {
                res.send(threadItemResult.messages[0]);
            }
        } catch (ex) {
            console.log(ex);
            res.send(ex.message);
        }
    });

    app.listen({ port: process.env.SERVER_PORT }, () => {
        console.log(`Server ready on port ${process.env.SERVER_PORT}`);
    });
};

main();
