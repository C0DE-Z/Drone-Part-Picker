-- CreateEnum
CREATE TYPE "ScrapingStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Product" (
    "id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "category" STRING NOT NULL,
    "brand" STRING,
    "sku" STRING,
    "description" STRING,
    "imageUrl" STRING,
    "specifications" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" STRING NOT NULL,
    "name" STRING NOT NULL,
    "website" STRING NOT NULL,
    "logoUrl" STRING,
    "isActive" BOOL NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPrice" (
    "id" STRING NOT NULL,
    "productId" STRING NOT NULL,
    "vendorId" STRING NOT NULL,
    "price" FLOAT8 NOT NULL,
    "currency" STRING NOT NULL DEFAULT 'USD',
    "url" STRING NOT NULL,
    "inStock" BOOL NOT NULL DEFAULT true,
    "shippingInfo" STRING,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" STRING NOT NULL,
    "productId" STRING NOT NULL,
    "vendorId" STRING NOT NULL,
    "price" FLOAT8 NOT NULL,
    "currency" STRING NOT NULL DEFAULT 'USD',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapingJob" (
    "id" STRING NOT NULL,
    "vendor" STRING NOT NULL,
    "category" STRING,
    "status" "ScrapingStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" STRING,
    "productsFound" INT4 NOT NULL DEFAULT 0,
    "productsUpdated" INT4 NOT NULL DEFAULT 0,
    "productsCreated" INT4 NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScrapingJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_name_key" ON "Vendor"("name");

-- CreateIndex
CREATE INDEX "Vendor_isActive_idx" ON "Vendor"("isActive");

-- CreateIndex
CREATE INDEX "VendorPrice_productId_idx" ON "VendorPrice"("productId");

-- CreateIndex
CREATE INDEX "VendorPrice_vendorId_idx" ON "VendorPrice"("vendorId");

-- CreateIndex
CREATE INDEX "VendorPrice_lastUpdated_idx" ON "VendorPrice"("lastUpdated");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPrice_productId_vendorId_key" ON "VendorPrice"("productId", "vendorId");

-- CreateIndex
CREATE INDEX "PriceHistory_productId_idx" ON "PriceHistory"("productId");

-- CreateIndex
CREATE INDEX "PriceHistory_timestamp_idx" ON "PriceHistory"("timestamp");

-- CreateIndex
CREATE INDEX "ScrapingJob_status_idx" ON "ScrapingJob"("status");

-- CreateIndex
CREATE INDEX "ScrapingJob_vendor_idx" ON "ScrapingJob"("vendor");

-- CreateIndex
CREATE INDEX "ScrapingJob_createdAt_idx" ON "ScrapingJob"("createdAt");

-- AddForeignKey
ALTER TABLE "VendorPrice" ADD CONSTRAINT "VendorPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPrice" ADD CONSTRAINT "VendorPrice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
