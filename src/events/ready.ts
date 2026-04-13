import type { Client } from "discord.js";

export function onReady(client: Client) {
  console.log(`Online as ${client.user?.tag}`);
}