import { env } from "./config/env";
import { buildServer } from "./server";

async function main(): Promise<void> {
  const app = await buildServer();
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void main();
