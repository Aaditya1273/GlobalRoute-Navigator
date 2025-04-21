const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Find all TS and TSX files in the project
async function findAllFiles() {
  return glob('src/**/*.{ts,tsx}', { ignore: ['src/**/*.d.ts', 'node_modules/**'] });
}

// Mock for useAuth to handle missing Clerk
const mockUseAuthCode = `
// Mock useAuth for when Clerk is not available
const useAuth = () => {
  return { isSignedIn: false, userId: null };
};
`;

// Process files with Clerk references
async function processFiles() {
  const files = await findAllFiles();
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip files that don't use Clerk
    if (!content.includes('@clerk/') && !content.includes('useAuth')) {
      continue;
    }
    
    console.log(`Processing ${file}...`);
    
    // Replace direct import of useAuth
    if (content.includes("import { useAuth }") || content.includes("import {useAuth}")) {
      content = content.replace(
        /import\s+{\s*(useAuth)(\s*,|\s*})(.*)['"]@clerk\/nextjs['"]/g,
        (match, p1, p2, p3) => {
          // Keep other imports from Clerk if any
          if (p2.includes(',') || p3.includes(',')) {
            return match.replace('useAuth,', '').replace(', useAuth', '');
          }
          // If useAuth is the only import, remove the whole line
          return '// Clerk auth disabled';
        }
      );
      
      // Add mock useAuth at the top of file (after imports)
      const importEnd = content.lastIndexOf('import');
      if (importEnd !== -1) {
        const importEndPos = content.indexOf('\n', importEnd) + 1;
        content = content.slice(0, importEndPos) + mockUseAuthCode + content.slice(importEndPos);
      } else {
        content = mockUseAuthCode + content;
      }
    }
    
    // Handle useAuth usage
    if (content.includes("useAuth()")) {
      // Add check if the mock isn't already added
      if (!content.includes("// Mock useAuth for when Clerk is not available")) {
        // Add mock at top of file after imports
        const importEnd = content.lastIndexOf('import');
        if (importEnd !== -1) {
          const importEndPos = content.indexOf('\n', importEnd) + 1;
          content = content.slice(0, importEndPos) + mockUseAuthCode + content.slice(importEndPos);
        } else {
          content = mockUseAuthCode + content;
        }
      }
    }
    
    // Replace ClerkProvider usage
    if (content.includes("<ClerkProvider>") || content.includes("<ClerkProvider ")) {
      content = content.replace(
        /<ClerkProvider[^>]*>([\s\S]*?)<\/ClerkProvider>/g,
        '$1' // Keep children but remove ClerkProvider
      );
    }
    
    // Save changes
    fs.writeFileSync(filePath, content);
  }
}

processFiles().then(() => {
  console.log('Fixed Clerk references in all files!');
}).catch(err => {
  console.error('Error processing files:', err);
}); 