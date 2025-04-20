// This is a mock Prisma client that won't cause build errors
const mockPrisma = {
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
}

export default mockPrisma
