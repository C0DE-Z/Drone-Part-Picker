-- CreateTable
CREATE TABLE "User" (
    "id" STRING NOT NULL,
    "name" STRING,
    "email" STRING NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" STRING,
    "password" STRING,
    "bio" STRING,
    "location" STRING,
    "website" STRING,
    "github" STRING,
    "twitter" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "type" STRING NOT NULL,
    "provider" STRING NOT NULL,
    "providerAccountId" STRING NOT NULL,
    "refresh_token" STRING,
    "access_token" STRING,
    "expires_at" INT4,
    "token_type" STRING,
    "scope" STRING,
    "id_token" STRING,
    "session_state" STRING,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" STRING NOT NULL,
    "sessionToken" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" STRING NOT NULL,
    "token" STRING NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "DroneBuild" (
    "id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "description" STRING,
    "isPublic" BOOL NOT NULL DEFAULT false,
    "userId" STRING NOT NULL,
    "tags" JSONB,
    "category" STRING,
    "motor" JSONB,
    "frame" JSONB,
    "stack" JSONB,
    "camera" JSONB,
    "prop" JSONB,
    "battery" JSONB,
    "customWeights" JSONB,
    "totalWeight" FLOAT8,
    "thrustToWeightRatio" FLOAT8,
    "estimatedTopSpeed" INT4,
    "estimatedFlightTime" FLOAT8,
    "powerConsumption" FLOAT8,
    "viewCount" INT4 NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DroneBuild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomPart" (
    "id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "description" STRING,
    "category" STRING NOT NULL,
    "specifications" JSONB NOT NULL,
    "isPublic" BOOL NOT NULL DEFAULT false,
    "userId" STRING NOT NULL,
    "viewCount" INT4 NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "buildId" STRING,
    "partId" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" STRING NOT NULL,
    "content" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "buildId" STRING,
    "partId" STRING,
    "parentId" STRING,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" STRING NOT NULL,
    "followerId" STRING NOT NULL,
    "followingId" STRING NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "DroneBuild_userId_idx" ON "DroneBuild"("userId");

-- CreateIndex
CREATE INDEX "DroneBuild_isPublic_idx" ON "DroneBuild"("isPublic");

-- CreateIndex
CREATE INDEX "DroneBuild_category_idx" ON "DroneBuild"("category");

-- CreateIndex
CREATE INDEX "CustomPart_userId_idx" ON "CustomPart"("userId");

-- CreateIndex
CREATE INDEX "CustomPart_isPublic_idx" ON "CustomPart"("isPublic");

-- CreateIndex
CREATE INDEX "CustomPart_category_idx" ON "CustomPart"("category");

-- CreateIndex
CREATE INDEX "Like_buildId_idx" ON "Like"("buildId");

-- CreateIndex
CREATE INDEX "Like_partId_idx" ON "Like"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_buildId_key" ON "Like"("userId", "buildId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_partId_key" ON "Like"("userId", "partId");

-- CreateIndex
CREATE INDEX "Comment_buildId_idx" ON "Comment"("buildId");

-- CreateIndex
CREATE INDEX "Comment_partId_idx" ON "Comment"("partId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DroneBuild" ADD CONSTRAINT "DroneBuild_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomPart" ADD CONSTRAINT "CustomPart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "DroneBuild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_partId_fkey" FOREIGN KEY ("partId") REFERENCES "CustomPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "DroneBuild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_partId_fkey" FOREIGN KEY ("partId") REFERENCES "CustomPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
