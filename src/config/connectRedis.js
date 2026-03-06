import IORedis from "ioredis";
import "dotenv/config";

//without lazyconnects . it connects automatically in this line when we creating redisClient... and we dont need to write redisClient.connect if we write we got error that redis is already connected
const redisClient = new IORedis(process.env.REDIS_URI, {
    lazyConnect: true
});

export const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log("Redis Connected");

    } catch (err) {
        console.error("Redis Connection Failed:", err.message);
        process.exit(1);
    }
};
export default redisClient;