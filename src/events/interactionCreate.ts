import type { Interaction, ModalSubmitInteraction } from "discord.js";
import { db } from "../db/database";

const SCHEDULE_MODAL_ID = "schedule-message-modal";

type InsertResult = {
  lastInsertRowid: number | bigint;
  changes: number;
};

export async function onInteractionCreate(interaction: Interaction) {
  // entry point
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      await interaction.reply({
        content: "This command is not available.",
        ephemeral: true,
      });
      return;
    }

    await command.execute(interaction);
    return;
  }

  // Handle the schedule message modal submission
  if (interaction.isModalSubmit() && interaction.customId === SCHEDULE_MODAL_ID) {
    await handleScheduleModal(interaction);
  }
}

async function handleScheduleModal(interaction: ModalSubmitInteraction) {
  // modal submissions must come from a channel
  if (!interaction.inGuild()) {
    await interaction.reply({
      content: "This form can only be submitted inside a server.",
      ephemeral: true,
    });
    return;
  }

  // Read values from the submitted modal fields
  const title = interaction.fields.getTextInputValue("schedule_title").trim();
  const description = interaction.fields.getTextInputValue("schedule_description").trim();
  const scheduledTimeInput = interaction.fields.getTextInputValue("schedule_time").trim();

  const scheduledAt = new Date(scheduledTimeInput);

  if (Number.isNaN(scheduledAt.getTime())) {
    await interaction.reply({
      content: "The scheduled time is invalid. Please provide a valid ISO 8601 timestamp.",
      ephemeral: true,
    });
    return;
  }

  if (scheduledAt.getTime() <= Date.now()) {
    await interaction.reply({
      content: "The scheduled time must be in the future.",
      ephemeral: true,
    });
    return;
  }

  const statement = db.prepare(`
    INSERT INTO scheduled_messages (
      channel_id,
      title,
      description,
      scheduled_at,
      status
    ) VALUES (
      @channel_id,
      @title,
      @description,
      @scheduled_at,
      'pending'
    )
  `);

  const result = statement.run({
      channel_id: interaction.channelId,
      title,
      description,
      scheduled_at: scheduledAt.toISOString(),
  }) as unknown as InsertResult;

  const insertedId = Number(result.lastInsertRowid);

  // Confirm the scheduled message was saved successfully.
  await interaction.reply({
    content: [
      "Your scheduled message has been saved successfully.",
      `Message ID: ${insertedId}`,
      `Scheduled Time: ${scheduledAt.toISOString()}`,
    ].join("\n"),
    ephemeral: true,
  });
}