export async function fetchResult(apiUrl) {
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return await response.json();
}
