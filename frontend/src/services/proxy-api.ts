import axios from "axios"

// Use the Next.js API route as a proxy
const API_URL = "/api/proxy"

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
})

export const findPaths = async (data: any) => {
  try {
    // Convert form values to match backend expectations
    const formattedData = {
      ...data,
      // Convert 'avoid' to 'avoid' and 'allow' to 'ignore' for backend compatibility
      prohibited_flag: data.prohibited_flag === "allow" ? "ignore" : "avoid",
      restricted_flag: data.restricted_flag === "allow" ? "ignore" : data.restricted_flag,
    }

    console.log("Sending data to API via proxy:", formattedData)

    const response = await api.post("/find_paths/", formattedData)
    console.log("API Response via proxy:", response.data)
    return response.data
  } catch (error) {
    console.error("Full error object:", error)

    if (axios.isAxiosError(error)) {
      // Log detailed information about the error
      console.error("Axios Error Details:", {
        message: error.message,
        code: error.code,
        response: error.response,
        request: error.request,
      })

      if (error.response?.status === 422) {
        // Extract and log the validation error details
        console.error("Validation Error:", error.response.data.detail)
        throw new Error(`Validation Error: ${error.response.data.detail[0].msg}`)
      } else if (error.code === "ERR_NETWORK") {
        console.error("Network Error - Check if the server is running")
        throw new Error("Cannot connect to server. Please make sure the backend is running.")
      } else if (error.code === "ECONNABORTED") {
        console.error("Request timed out")
        throw new Error("Request timed out. The server might be overloaded.")
      }
    }

    console.error("Axios Error:", error)
    throw error
  }
}

