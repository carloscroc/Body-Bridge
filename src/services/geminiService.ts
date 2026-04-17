import { SearchResult } from "../types";
import { sanitize, sanitizeUrl } from "../utils/sanitize";

const API_BASE_URL = '/api';

export const analyzeImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze-meal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ image: base64Image, mimeType }),
    });

    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    return sanitize(data.text || "Unable to analyze image.");
  } catch (error) {
    console.error("AI Analysis error:", error);
    return "Error analyzing image.";
  }
};

export const searchFitnessInfo = async (query: string): Promise<SearchResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/search-fitness`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ query })
    });

    if (!response.ok) throw new Error('Network response was not ok');

    const data = await response.json();
    // Sanitize text and links
    const sanitizedLinks = (data.links || []).map((link: any) => ({
      web: link.web ? { ...link.web, uri: sanitizeUrl(link.web.uri), title: sanitize(link.web.title) } : undefined,
      maps: link.maps ? { ...link.maps, uri: sanitizeUrl(link.maps.uri), title: sanitize(link.maps.title) } : undefined,
    }));

    return {
      text: sanitize(data.text || "No results."),
      links: sanitizedLinks
    };
  } catch (error) {
    console.error("AI Search error:", error);
    return { text: "Error fetching information.", links: [] };
  }
};
// ...

export const getExerciseGuide = async (exerciseName: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/exercise-guide`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ exerciseName })
    });

    if (!response.ok) throw new Error('Network response was not ok');

    const data = await response.json();
    return sanitize(data.text || "Guide currently unavailable.");
  } catch (error) {
    console.error("AI Guide error:", error);
    return "Guide currently unavailable.";
  }
};
