import "dotenv/config";
import { REST, Routes } from "discord.js";
import { scheduleCommand } from "./commands/schedule";

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

async function register() {
  await rest.put(
    Routes.applicationCommands("1493146748221259796"),
    {
      body: [scheduleCommand.data.toJSON()],
    }
  );

  console.log("Commands registered");
}

register();