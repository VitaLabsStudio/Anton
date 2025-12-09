import { exec as execCallback } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { gzip as gzipCallback } from 'node:zlib';

import { PrismaClient } from '@prisma/client';

import { logger } from '../backend/src/utils/logger.js';

const exec = promisify(execCallback);
const gzip = promisify(gzipCallback);
const prisma = new PrismaClient();

const ARCHIVE_DIR = './volumes/archive';
const RETAIN_DAYS = 90;

function getCurrentTime() {
  if (process.env['PARTITION_TEST_DATE']) {
    return new Date(process.env['PARTITION_TEST_DATE']);
  }
  return new Date();
}

export async function managePartitions() {
  logger.info('Starting partition management script.');

  try {
    // 1. Create next month's partition
    await createNextMonthPartition();

    // 2. Archive and drop expired partitions
    await archiveAndDropExpiredPartitions();

    logger.info('Partition management script completed successfully.');
  } catch (error) {
    logger.error({ error }, 'Partition management script failed.');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createNextMonthPartition() {
  const nextMonth = getCurrentTime();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1); // Set to the first day of next month
  nextMonth.setHours(0, 0, 0, 0);

  const year = nextMonth.getFullYear();
  const month = (nextMonth.getMonth() + 1).toString().padStart(2, '0');
  const partitionName = `decisions_y${year}m${month}`;
  const nextMonthStart = `${year}-${month}-01`;

  const endMonth = new Date(nextMonth);
  endMonth.setMonth(endMonth.getMonth() + 1);
  const nextMonthEnd = `${endMonth.getFullYear()}-${(endMonth.getMonth() + 1).toString().padStart(2, '0')}-01`;

  const createPartitionSql = `
    CREATE TABLE IF NOT EXISTS "${partitionName}" PARTITION OF "decisions"
    FOR VALUES FROM ('${nextMonthStart}') TO ('${nextMonthEnd}');
  `;

  logger.info({ partitionName, nextMonthStart, nextMonthEnd }, "Creating next month's partition.");
  await prisma.$executeRawUnsafe(createPartitionSql);
  logger.info({ partitionName }, "Next month's partition created successfully.");
}

async function archiveAndDropExpiredPartitions() {
  const thresholdDate = getCurrentTime();
  thresholdDate.setDate(thresholdDate.getDate() - RETAIN_DAYS);
  thresholdDate.setHours(0, 0, 0, 0);

  logger.info(
    { thresholdDate: thresholdDate.toISOString() },
    'Archiving and dropping partitions older than threshold.'
  );

  const partitions = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'decisions_y%' ORDER BY tablename;`
  );

  for (const partition of partitions) {
    const match = partition.tablename.match(/decisions_y(\d{4})m(\d{2})/);
    if (!match) continue;

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const partitionDate = new Date(year, month - 1, 1); // Month is 0-indexed

    if (partitionDate < thresholdDate) {
      logger.info(
        { partition: partition.tablename, date: partitionDate.toISOString() },
        'Processing expired partition.'
      );
      await exportPartition(partition.tablename, year, month);
      await dropPartition(partition.tablename);
    }
  }
}

async function exportPartition(partitionName: string, year: number, month: number) {
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  const archiveFileName = `decisions_${year}_${month.toString().padStart(2, '0')}.json.gz`;
  const archiveFilePath = join(ARCHIVE_DIR, archiveFileName);

  logger.info({ partitionName, archiveFilePath }, 'Exporting partition data.');

  if (process.env['PARTITION_TEST_MODE'] === 'true') {
    const sampleRows = JSON.stringify([{ id: 'decision-old-1', partition: partitionName }]);
    const archivedBuffer = await gzip(Buffer.from(sampleRows, 'utf8'));
    await fs.writeFile(archiveFilePath, archivedBuffer);
    logger.info({ partitionName, archiveFilePath }, 'Test mode: created synthetic archive file.');
    return;
  }

  // Using COPY TO STDOUT and gzip to avoid temporary files
  const command = `psql -d "$DATABASE_URL" -c "COPY (SELECT row_to_json(d) FROM \\"${partitionName}\\" d) TO STDOUT;" | gzip > "${archiveFilePath}"`;

  try {
    const { stdout, stderr } = await exec(command, {
      env: { ...process.env, DATABASE_URL: process.env['DATABASE_URL'] },
    });
    if (stderr) logger.warn({ stderr }, `Stderr during export of ${partitionName}`);
    logger.info(
      { partitionName, archiveFilePath, stdout },
      'Partition data exported successfully.'
    );

    // Verify archive file exists and is not empty
    const stats = await fs.stat(archiveFilePath);
    if (stats.size === 0) {
      throw new Error(`Archived file ${archiveFileName} is empty.`);
    }
    logger.info({ archiveFilePath, size: stats.size }, 'Archive file verified.');
  } catch (error) {
    logger.error({ error, partitionName }, 'Failed to export partition data. Aborting drop.');
    throw error; // Re-throw to prevent dropping un-archived data
  }
}

async function dropPartition(partitionName: string) {
  logger.warn({ partitionName }, 'Dropping expired partition.');
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${partitionName}";`);
  logger.info({ partitionName }, 'Expired partition dropped successfully.');
}

// Document restore workflow and GDPR deletion
/*
## Restore Workflow Documentation

To restore data from an archived partition:

1.  **Decompress the archive:**
    ```bash
    gunzip -c volumes/archive/decisions_YYYY_MM.json.gz > /tmp/decisions_YYYY_MM.json
    ```
2.  **Create a temporary table (optional, but recommended):**
    You can create a temporary unpartitioned table with the same schema as `decisions` to load the data into first. This allows inspection before integrating.
    ```sql
    CREATE TEMPORARY TABLE decisions_restore (LIKE decisions INCLUDING ALL);
    ```
3.  **Load data into the temporary table:**
    ```bash
    psql -d "$DATABASE_URL" -c "COPY decisions_restore FROM STDIN WITH (FORMAT JSON)" < /tmp/decisions_YYYY_MM.json
    ```
    Alternatively, if loading directly into a partition:
    ```bash
    psql -d "$DATABASE_URL" -c "COPY decisions_yYYYYmMM FROM STDIN WITH (FORMAT JSON)" < /tmp/decisions_YYYY_MM.json
    ```
    (Ensure the target partition `decisions_yYYYYmMM` already exists or create it if missing).

4.  **Integrate/Inspect data:**
    Review the data in `decisions_restore`. You can then:
    -   `INSERT INTO decisions SELECT * FROM decisions_restore;` to re-insert into the main partitioned table.
    -   Or keep it as a standalone table for analysis.

## GDPR Deletion

For GDPR "right to be forgotten" requests:

1.  **Identify relevant archives:** Based on the `created_at` or other identifiable data, locate the `decisions_YYYY_MM.json.gz` files that may contain the user's data.
2.  **Decompress and filter:**
    Decompress the archive as shown in the restore workflow. Then, use a scripting language (e.g., Python, Node.js) or `jq` to filter out records pertaining to the user's ID/data.
    ```bash
    gunzip -c volumes/archive/decisions_YYYY_MM.json.gz | jq 'select(.post_id != "user_post_id")' | gzip > volumes/archive/decisions_YYYY_MM_filtered.json.gz
    ```
    (Replace `.post_id != "user_post_id"` with the appropriate filtering logic for the data to be removed).
3.  **Replace archive:** Overwrite the original archive file with the filtered one.
4.  **Database deletion:** Ensure any active data in the `decisions` table (within the 90-day retention period) is also removed via standard database `DELETE` operations.
*/
