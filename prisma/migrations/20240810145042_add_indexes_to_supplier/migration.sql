-- CreateTable
CREATE TABLE "ShippingOption" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_supplier_contact_email" ON "supplier"("contact_email");

-- CreateIndex
CREATE INDEX "idx_supplier_country_company_name_specialization" ON "supplier"("country", "company_name", "specialization");

-- CreateIndex
CREATE INDEX "idx_supplier_country_specialization" ON "supplier"("country", "specialization");

-- CreateIndex
CREATE INDEX "idx_supplier_founded_date" ON "supplier"("founded_date");

-- CreateIndex
CREATE INDEX "idx_supplier_founded_date_country" ON "supplier"("founded_date", "country");

-- CreateIndex
CREATE INDEX "idx_supplier_is_active_staff_size" ON "supplier"("is_active", "staff_size");

-- CreateIndex
CREATE INDEX "idx_supplier_specialization_staff_size" ON "supplier"("specialization", "staff_size");
