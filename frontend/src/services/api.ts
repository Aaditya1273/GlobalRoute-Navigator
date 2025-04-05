import axios from "axios";

// Use the API_URL that matches your setup
const API_URL = "http://127.0.0.1:8000";

// Create axios instance with better timeout and retry logic
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: false, // Must be false for CORS with allow_origins=["*"]
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // Increased timeout to 30 seconds
});

// Add a request interceptor to log requests
api.interceptors.request.use(
  (config) => {
    console.log(`Making request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("Response error:", error);
    
    if (error.code === "ERR_NETWORK") {
      console.error("Network Error - Check if the backend server is running at", API_URL);
      // You could add automatic reconnect logic here
      return Promise.reject(new Error(`Cannot connect to server at ${API_URL}. Please make sure the backend is running.`));
    }
    
    return Promise.reject(error);
  }
);

// Test function to verify CORS is working
export const testCors = async () => {
  try {
    const response = await api.get("/test-cors");
    console.log("CORS Test Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("CORS Test Error:", error);
    throw error;
  }
};

// Helper function for retrying a failed request
const retryRequest = async (fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0 || !(error instanceof Error)) {
      throw error;
    }

    // Only retry network errors
    if (!axios.isAxiosError(error) || error.code !== "ERR_NETWORK") {
      throw error;
    }

    console.log(`Retrying request... (${retries} attempts left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryRequest(fn, retries - 1, delay);
  }
};

export const findPaths = async (data: any) => {
  // Convert form values to match backend expectations
  const formattedData = {
    ...data,
    // Convert 'avoid' to 'avoid' and 'allow' to 'ignore' for backend compatibility
    prohibited_flag: data.prohibited_flag === "allow" ? "ignore" : "avoid",
    restricted_flag: data.restricted_flag === "allow" ? "ignore" : data.restricted_flag,
    // Ensure cargo_weight is passed (use weight field from form)
    cargo_weight: data.weight || 1.0, // Default to 1.0 kg if not provided
  };

  console.log("Sending data to API:", formattedData);

  try {
    // Use the retry mechanism
    const response = await retryRequest(
      () => api.post("/find_paths/", formattedData),
      3,  // retry 3 times
      1000 // wait 1 second between retries
    );

    console.log("API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Full error object:", error);

    if (axios.isAxiosError(error)) {
      // Log detailed information about the error
      console.error("Axios Error Details:", {
        message: error.message,
        code: error.code,
        response: error.response,
        request: error.request,
      });

      if (error.response?.status === 422) {
        // Extract and log the validation error details
        console.error("Validation Error:", error.response.data.detail);
        throw new Error(`Validation Error: ${error.response.data.detail[0].msg}`);
      } else if (error.code === "ERR_NETWORK") {
        console.error("Network Error - Check if the server is running");
        throw new Error("Cannot connect to server. Please make sure the backend is running at http://127.0.0.1:8000");
      } else if (error.code === "ECONNABORTED") {
        console.error("Request timed out");
        throw new Error("Request timed out. The server might be overloaded.");
      }
    }

    throw error;
  }
};