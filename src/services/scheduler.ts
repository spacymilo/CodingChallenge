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

// helper
function dbAll<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

// helper
function dbRun(sql: string, params: unknown[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function startScheduler(client: Client) {
  if (intervalHandle) return;

  const tick = async () => {
    try {
      // fetch due scheduled messages
      const rows = await dbAll<ScheduledMessageRow>(
        `
        SELECT id, channel_id, title, description, scheduled_at
        FROM scheduled_messages
        WHERE status = ?
          AND scheduled_at <= ?
        ORDER BY scheduled_at ASC
        `,
        ["pending", new Date().toISOString()]
      );

      if (rows.length === 0) return;

      for (const scheduledMessage of rows) {
        await dispatchScheduledMessage(client, scheduledMessage);
      }
    } catch (err) {
      console.error("Failed to fetch scheduled messages.", err);
    }
  };

  void tick();

  intervalHandle = setInterval(() => {
    void tick();
  }, TICK_INTERVAL_MS);
}

async function dispatchScheduledMessage(
  client: Client,
  message: ScheduledMessageRow
) {
  const channel = await client.channels.fetch(message.channel_id);

  if (!channel || !channel.isTextBased() || !("send" in channel)) {
    await markAsFailed(
      message.id,
      "Target channel is not text-based or could not be resolved."
    );
    return;
  }

  try {
    // send message to Discord channel
    await channel.send({
      content: `**${message.title}**\n${message.description}`,
    });

    // mark as sent
    await dbRun(
      `
      UPDATE scheduled_messages
      SET status = ?,
          sent_at = ?,
          error_message = NULL
      WHERE id = ?
      `,
      ["sent", new Date().toISOString(), message.id]
    );
  } catch (error) {
    await markAsFailed(
      message.id,
      error instanceof Error ? error.message : "Unknown dispatch error"
    );
  }
}

// mark message as failed
async function markAsFailed(id: number, errorMessage: string) {
  await dbRun(
    `
    UPDATE scheduled_messages
    SET status = ?,
        error_message = ?
    WHERE id = ?
    `,
    ["failed", errorMessage, id]
  );
}