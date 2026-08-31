import app from "./app";
import { config } from "./config";
import { connectRedis } from "./db/redis";

async function start() {
    try {
        await connectRedis();
    } catch (err) {
        console.error("[server] failed to connect to Redis, aborting startup:", err);
        process.exit(1);
    }

    app.listen(config.port, () => {
        console.log(`🚀 DeskMate Core Engine running seamlessly on port ${config.port}`);
    });
}

start();