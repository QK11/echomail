const mongoose = require("mongoose");
const { Worker } = require("bullmq");
const http = require("http");

const config = require("./src/configuration");
const app = require("./src/application");
const handleJob = require("./src/workers/primary");

const port = config.express.port;
app.set("port", port);

const server = http.createServer(app);

(async () => {
  const conn = await mongoose.connect(config.mongo.uri);

  console.log(
    `Connected to MongoDB: ${conn.connection.name} on ${conn.connection.host}:${conn.connection.port} 🔥`
  );

  new Worker("Primary", handleJob, {
    concurrency: 1,
    connection: {
      host: config.redis.host,
      port: config.redis.port,
      db: config.redis.db
    }
  });

  server.listen(port, () => {
    console.log(
      `Server is running on port ${port} in ${config.express.environment} mode 🎉`
    );
  });
})();
