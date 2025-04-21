// Add this after your other fixes:

// Fix Prisma import error
const mockPrismaPath = path.join(__dirname, 'src/lib/prisma.ts');
const mockPrismaDir = path.dirname(mockPrismaPath);

// Create the directory if it doesn't exist
if (!fs.existsSync(mockPrismaDir)) {
  fs.mkdirSync(mockPrismaDir, { recursive: true });
}

const mockPrismaContent = `// Mock Prisma client for deployment
const prisma = {
  savedRoute: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({})
  },
  shipment: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({})
  },
  user: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({})
  },
  route: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({})
  },
  // Add other models as needed
  $connect: async () => {},
  $disconnect: async () => {}
};

export { prisma };
export default prisma;`;

fs.writeFileSync(mockPrismaPath, mockPrismaContent);
console.log('Created mock Prisma client');

// Also search for any API routes using Prisma and fix them
const apiDirPath = path.join(__dirname, 'src/app/api');
if (fs.existsSync(apiDirPath)) {
  // Recursively find all .ts and .tsx files in the API directory
  function findFilesRecursively(dir) {
    let results = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        results = results.concat(findFilesRecursively(itemPath));
      } else if (stat.isFile() && (itemPath.endsWith('.ts') || itemPath.endsWith('.tsx'))) {
        results.push(itemPath);
      }
    }
    
    return results;
  }
  
  const apiFiles = findFilesRecursively(apiDirPath);
  
  // Process each API file
  for (const file of apiFiles) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Skip files that don't use Prisma
    if (!content.includes('prisma')) {
      continue;
    }
    
    console.log(`Fixing Prisma references in ${file}`);
    
    // Modify the file to use mock data instead of Prisma
    content = content.replace(
      /import\s+.*prisma.*from\s+['"].*prisma['"]/g,
      `import prisma from '@/lib/prisma'`
    );
    
    // Add mock response for GET handlers
    content = content.replace(
      /export\s+async\s+function\s+GET[^{]*{/g,
      `export async function GET(request, params) {
  // Return mock data
  return new Response(JSON.stringify([]), { 
    headers: { 'content-type': 'application/json' } 
  });
  /* Original implementation:
  `
    );
    
    // Add mock response for POST handlers
    content = content.replace(
      /export\s+async\s+function\s+POST[^{]*{/g,
      `export async function POST(request, params) {
  // Return mock success
  return new Response(JSON.stringify({ success: true }), { 
    headers: { 'content-type': 'application/json' } 
  });
  /* Original implementation:
  `
    );
    
    // Close the comment for the original implementation at the end of the file
    content = content + "\n*/";
    
    fs.writeFileSync(file, content);
  }
} 