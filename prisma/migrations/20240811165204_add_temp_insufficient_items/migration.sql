-- CreateTable
CREATE TABLE "temp_insufficient_items" (
    "memberId" INTEGER NOT NULL,
    "itemName" TEXT NOT NULL,

    CONSTRAINT "temp_insufficient_items_pkey" PRIMARY KEY ("memberId","itemName")
);
