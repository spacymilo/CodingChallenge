import type { Client } from "discord.js";
import { db } from "../db/database";

// types for database rows
type ScheduledMessageRow = {
  id: number;
  channel_id: string;
  title: string;
  description: string;
  scheduled_at: string;
};

let intervalHandle: NodeJS.Timeout | null = null;
const TICK_INTERVAL_MS = 15_000;

export function startScheduler(client: Client) {
  if (intervalHandle) return;

  const tick = async () => {
    const dueMessages = db
        .prepare(
            `
          SELECT id, channel_id, title, description, scheduled_at
          FROM scheduled_messages
          WHERE status = 'pending'
            AND scheduled_at <= ?
          ORDER BY scheduled_at ASC
        `
        )
        .all(new Date().toISOString()) as unknown as ScheduledMessageRow[];

    for (const scheduledMessage of dueMessages) {
      await dispatchScheduledMessage(client, scheduledMessage);
    }
  };

  void tick();
  intervalHandle = setInterval(() => {
    void tick();
  }, TICK_INTERVAL_MS);
}

async function dispatchScheduledMessage(client: Client, message: ScheduledMessageRow) {
  const channel = await client.channels.fetch(message.channel_id);

  if (!channel || !channel.isTextBased() || !("send" in channel)) {
    markAsFailed(message.id, "Target channel is not text-based or could not be resolved.");
    return;
  }

  try {
    // Channel send
    await channel.send({
      content: `**${message.title}**\n${message.description}`,
    });

    // Mark as sent
    db.prepare(
      `
        UPDATE scheduled_messages
        SET status = 'sent',
            sent_at = ?,
            error_message = NULL
        WHERE id = ?
      `,
    ).run(new Date().toISOString(), message.id);
  } catch (error) {
    markAsFailed(
      message.id,
      error instanceof Error ? error.message : "Unknown dispatch error",
    );
  }
}

// Mark a scheduled message as failed
function markAsFailed(id: number, errorMessage: string) {
  db.prepare(
    `
      UPDATE scheduled_messages
      SET status = 'failed',
          error_message = ?
      WHERE id = ?
    `,
  ).run(errorMessage, id);
}