// This script completely bypasses Prisma during Vercel deployment
const fs = require('fs');
const path = require('path');

// Create extremely simplified dummy schema
const simplifiedSchema = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// Extremely simplified models with correct relations
model User {
  id          String       @id @default(cuid())
  email       String       @unique
  savedRoutes SavedRoute[]
  shipments   Shipment[]
}

model SavedRoute {
  id     String @id @default(cuid())
  user   User   @relation(fields: [userId], references: [id])
  userId String
}

model Shipment {
  id      String  @id @default(uuid())
  user    User    @relation(fields: [userId], references: [id])
  userId  String
  routes  Route[]
}

model Route {
  id        String    @id @default(cuid())
  segments  Segment[]
  shipments Shipment[]
}

model Segment {
  id      String @id @default(uuid())
  route   Route  @relation(fields: [routeId], references: [id])
  routeId String
}
`;

// Create a proper .env file
const envContent = `DATABASE_URL="file:./dev.db"`;

// Ensure prisma directory exists
if (!fs.existsSync('prisma')) {
  fs.mkdirSync('prisma', { recursive: true });
}

// Write simplified schema that will pass validation
fs.writeFileSync(path.join('prisma', 'schema.prisma'), simplifiedSchema);

// Write .env file
fs.writeFileSync('.env', envContent);

// Create empty dev.db file to prevent errors
fs.writeFileSync('dev.db', '');

// Create empty dummy file to replace API routes that use Prisma
const dummyApiContent = `
export default function handler(req, res) {
  return new Response(JSON.stringify({ message: "API disabled - use backend at https://globalroute-navigator-backend.onrender.com" }));
}
`;

// Check for and empty API directories
const apiDirs = [
  path.join('src', 'app', 'api'),
  path.join('src', 'pages', 'api')
];

apiDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    files.forEach(file => {
      if (file.isDirectory()) {
        const subdir = path.join(dir, file.name);
        const subdirFiles = fs.readdirSync(subdir);
        subdirFiles.forEach(subfile => {
          fs.writeFileSync(path.join(subdir, subfile), dummyApiContent);
        });
      } else {
        fs.writeFileSync(path.join(dir, file.name), dummyApiContent);
      }
    });
  }
});

console.log('Prisma bypass complete. Using simplified schema for build only.'); 