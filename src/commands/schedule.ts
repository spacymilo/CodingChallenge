import {
  ActionRowBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { BotCommand } from "../types/command";

const MODAL_ID = "schedule-message-modal";

export const scheduleCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("schedule")
    .setDescription("Open a form to create a scheduled message."),

    // Command execution handler
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "This command can only be used inside a server.",
        ephemeral: true,
      });
      return;
    }

    // build form
    const modal = new ModalBuilder()
      .setCustomId(MODAL_ID)
      .setTitle("Schedule a Message");

    const titleInput = new TextInputBuilder()
      .setCustomId("schedule_title")
      .setLabel("Title")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100)
      .setPlaceholder("Enter a concise title");

    const descriptionInput = new TextInputBuilder()
      .setCustomId("schedule_description")
      .setLabel("Description")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(2000)
      .setPlaceholder("Enter the message content");

    const timeInput = new TextInputBuilder()
      .setCustomId("schedule_time")
      .setLabel("Scheduled Time (ISO 8601)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("2026-05-01T15:00:00Z");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(timeInput),
    );

    await interaction.showModal(modal);
  },
};