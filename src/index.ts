import "dotenv/config";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import { scheduleCommand } from "./commands/schedule";
import { initDatabase } from "./db/database";
import { onInteractionCreate } from "./events/interactionCreate";
import { onReady } from "./events/ready";
import { startScheduler } from "./services/scheduler";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

const token = requireEnv("DISCORD_TOKEN");

async function bootstrap() {
  initDatabase();

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  // Command collection
  client.commands = new Collection();
  client.commands.set(scheduleCommand.data.name, scheduleCommand);

  client.once("ready", () => {
    onReady(client);
    startScheduler(client);
  });

  client.on("interactionCreate", onInteractionCreate);

  // login
  await client.login(token);
}

// bootstrap catch errors
bootstrap().catch((error) => {
  console.error("Fatal error during startup:", error);
  process.exit(1);
});