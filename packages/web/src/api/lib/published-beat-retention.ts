import { lt, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../database";
import { publishedBeatBlockMetrics } from "../database/schema";

const DAILY_RETENTION_DAYS = 90;

export async function rollupExpiredPublishedBeatMetrics(now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - DAILY_RETENTION_DAYS);
  const cutoffDay = cutoff.toISOString().slice(0, 10);
  const expiredDailyRows = await db
    .select()
    .from(publishedBeatBlockMetrics)
    .where(lt(publishedBeatBlockMetrics.day, cutoffDay));
  if (!expiredDailyRows.length) return { cutoffDay, rolledUpRows: 0, deletedDailyRows: 0 };

  const groups = new Map<
    string,
    {
      pageId: string;
      blockId: string;
      beatId: string;
      eventType: string;
      month: string;
      count: number;
    }
  >();
  for (const row of expiredDailyRows) {
    const month = row.day.slice(0, 7);
    const key = `${row.pageId}:${row.blockId}:${row.beatId}:${row.eventType}:${month}`;
    const current = groups.get(key) || {
      pageId: row.pageId,
      blockId: row.blockId,
      beatId: row.beatId,
      eventType: row.eventType,
      month,
      count: 0,
    };
    current.count += row.count;
    groups.set(key, current);
  }

  await db.transaction(async (tx) => {
    for (const group of groups.values()) {
      await tx.run(sql`
        insert into "published_beat_block_monthly_metrics" (
          "id", "page_id", "block_id", "beat_id", "event_type", "month", "count", "updated_at"
        ) values (
          ${randomUUID()}, ${group.pageId}, ${group.blockId}, ${group.beatId}, ${group.eventType},
          ${group.month}, ${group.count}, CURRENT_TIMESTAMP
        ) on conflict ("page_id", "block_id", "beat_id", "event_type", "month") do update set
          "count" = "published_beat_block_monthly_metrics"."count" + ${group.count},
          "updated_at" = CURRENT_TIMESTAMP
      `);
    }
    await tx.delete(publishedBeatBlockMetrics).where(lt(publishedBeatBlockMetrics.day, cutoffDay));
  });

  return {
    cutoffDay,
    rolledUpRows: groups.size,
    deletedDailyRows: expiredDailyRows.length,
  };
}
