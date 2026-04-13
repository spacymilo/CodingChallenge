import "dotenv/config";
import { Client, GatewayIntentBits, Collection } from "discord.js";
import { initDatabase } from "./db/database";
import { onReady } from "./events/ready";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Commands collection for future command handling
(client as any).commands = new Collection();

async function main() {
  initDatabase();

  client.once("ready", () => onReady(client));

  await client.login(process.env.DISCORD_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});