/*
  Warnings:

  - You are about to drop the column `payloadRef` on the `Packet` table. All the data in the column will be lost.
  - You are about to alter the column `threshold` on the `RuleResult` table. The data in that column could be lost. The data in that column will be cast from `String` to `Float`.
  - You are about to alter the column `value` on the `RuleResult` table. The data in that column could be lost. The data in that column will be cast from `String` to `Float`.
  - Added the required column `ruleYear` to the `RuleResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProfileField" ADD COLUMN "datasetRelease" TEXT;
ALTER TABLE "ProfileField" ADD COLUMN "geography" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Packet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" TEXT,
    CONSTRAINT "Packet_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Packet" ("id", "sessionId", "status") SELECT "id", "sessionId", "status" FROM "Packet";
DROP TABLE "Packet";
ALTER TABLE "new_Packet" RENAME TO "Packet";
CREATE UNIQUE INDEX "Packet_sessionId_key" ON "Packet"("sessionId");
CREATE INDEX "Packet_sessionId_idx" ON "Packet"("sessionId");
CREATE TABLE "new_RuleResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "ruleYear" TEXT NOT NULL,
    "inputRefs" TEXT,
    "threshold" REAL,
    "formula" TEXT,
    "value" REAL,
    "band" TEXT,
    "abstained" BOOLEAN NOT NULL DEFAULT false,
    "abstainReason" TEXT,
    "effectiveDate" TEXT,
    "geography" TEXT,
    "sourceUrl" TEXT,
    "citation" TEXT,
    CONSTRAINT "RuleResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RuleResult" ("citation", "effectiveDate", "formula", "geography", "id", "inputRefs", "ruleId", "sessionId", "sourceUrl", "threshold", "value") SELECT "citation", "effectiveDate", "formula", "geography", "id", "inputRefs", "ruleId", "sessionId", "sourceUrl", "threshold", "value" FROM "RuleResult";
DROP TABLE "RuleResult";
ALTER TABLE "new_RuleResult" RENAME TO "RuleResult";
CREATE INDEX "RuleResult_sessionId_idx" ON "RuleResult"("sessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
