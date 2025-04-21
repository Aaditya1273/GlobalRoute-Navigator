// Mock Prisma client for deployment
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
export default prisma;
