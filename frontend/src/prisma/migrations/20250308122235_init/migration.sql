-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('FASTEST', 'CHEAPEST', 'SAFEST');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'IN_TRANSIT', 'DELIVERED');

-- CreateEnum
CREATE TYPE "Mode" AS ENUM ('LAND', 'AIR', 'SEA');

-- CreateEnum
CREATE TYPE "RiskType" AS ENUM ('CONFLICT', 'DISASTER', 'SANCTION');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'LOGISTICS_PROVIDER', 'CLIENT');

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "cargo_weight" DOUBLE PRECISION NOT NULL,
    "cargo_volume" DOUBLE PRECISION NOT NULL,
    "priority" "Priority" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "Status" NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "total_cost" DOUBLE PRECISION NOT NULL,
    "total_time" DOUBLE PRECISION NOT NULL,
    "risk_score" DOUBLE PRECISION NOT NULL,
    "emission" DOUBLE PRECISION NOT NULL,
    "mode_sequence" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Segment" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "mode" "Mode" NOT NULL,
    "from_location" TEXT NOT NULL,
    "to_location" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "time" DOUBLE PRECISION NOT NULL,
    "border_crossings" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Segment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskEvent" (
    "id" TEXT NOT NULL,
    "type" "RiskType" NOT NULL,
    "location" TEXT NOT NULL,
    "severity" DOUBLE PRECISION NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Segment" ADD CONSTRAINT "Segment_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
