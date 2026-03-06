import http from "http";
import "dotenv/config";
import app from "./app.js";
import { connectRedis } from "./config/connectRedis.js";
import { connectMongo } from "./config/connectMongo.js";
// import { initIO } from "./socket/initSocket.js";


const PORT = process.env.PORT || 5000;

async function startServer() {
  try {

    await connectRedis();
    await connectMongo();

    const server = http.createServer(app);

    // await initIO(server);

    server.listen(PORT, () => {
      console.log("Server is running on port", PORT);
    });

  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

startServer();