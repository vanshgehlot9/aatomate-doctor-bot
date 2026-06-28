export const parseApiError = (error: any, fallback: string = "An error occurred"): string => {
  if (error?.response?.data?.detail) {
    if (typeof error.response.data.detail === "string") {
      return error.response.data.detail;
    }
    if (Array.isArray(error.response.data.detail)) {
      return error.response.data.detail[0]?.msg || fallback;
    }
  }
  return error?.message || fallback;
};
