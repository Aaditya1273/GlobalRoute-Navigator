// Clerk configuration
const clerkPublishableKey = "pk_test_dXNlZnVsLXBlZ2FzdXMtOTMuY2xlcmsuYWNjb3VudHMuZGV2JA";

// Export a unified configuration object
export const clerkConfig = {
  publishableKey: clerkPublishableKey,
};

// Fallback function for when Clerk fails to load
export const handleClerkError = (error: any) => {
  console.error("Clerk failed to load:", error);
  // You can implement custom fallback behavior here
  // For example, redirecting to a fallback auth page or showing a specific error message
};
