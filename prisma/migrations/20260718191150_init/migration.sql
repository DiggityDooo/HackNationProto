-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "ProfileField" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "rawValue" TEXT,
    "state" TEXT NOT NULL,
    "confidence" REAL,
    "sourceDocId" TEXT,
    "evidenceBox" TEXT,
    "ruleYear" TEXT,
    "effectiveDate" TEXT,
    "sourceUrl" TEXT,
    CONSTRAINT "ProfileField_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RuleResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "inputRefs" TEXT,
    "threshold" TEXT,
    "formula" TEXT,
    "value" TEXT,
    "effectiveDate" TEXT,
    "geography" TEXT,
    "sourceUrl" TEXT,
    "citation" TEXT,
    CONSTRAINT "RuleResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ruleVersion" TEXT,
    CONSTRAINT "AuditLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Packet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payloadRef" TEXT,
    CONSTRAINT "Packet_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProfileField_sessionId_idx" ON "ProfileField"("sessionId");

-- CreateIndex
CREATE INDEX "RuleResult_sessionId_idx" ON "RuleResult"("sessionId");

-- CreateIndex
CREATE INDEX "AuditLog_sessionId_idx" ON "AuditLog"("sessionId");

-- CreateIndex
CREATE INDEX "Packet_sessionId_idx" ON "Packet"("sessionId");
