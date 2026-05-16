export async function fetchHealth(): Promise<{ status: string }> {
  try {
    const response = await fetch('/health');
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Failed to fetch health status', error);
    throw error;
  }
}
