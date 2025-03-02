import axios from 'axios';
import { MEME_API_BASE_URL } from '../config/constants';

const api = axios.create({
  baseURL: MEME_API_BASE_URL,
  timeout: 10000,
});

// Fetch all meme templates
export const fetchTemplates = async () => {
  try {
    const response = await api.get('/templates');
    return response.data;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

// Fetch memes with pagination
export const fetchMemes = async (page = 1, limit = 20) => {
  try {
    const templates = await fetchTemplates();
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return templates.slice(start, end).map(template => ({
      id: template.id,
      url: `${MEME_API_BASE_URL}/images/${template.id}/Sample_Text/Bottom_Text.jpg`,
      name: template.name
    }));
  } catch (error) {
    console.error('Error fetching memes:', error);
    throw error;
  }
};

// Generate final meme
export const generateMeme = async (template, texts) => {
  try {
    if (!template?.id) {
      throw new Error('Invalid template');
    }

    // Process the texts
    const processedTexts = texts.map(text => {
      if (!text || text.trim() === '') return '_';
      return text.trim().replace(/\s+/g, '_');
    });

    // Create the URL
    const url = `${MEME_API_BASE_URL}/images/${template.id}/${processedTexts.join('/')}.jpg`;

    return { url };
  } catch (error) {
    console.error('Error generating meme:', error);
    throw new Error('Failed to generate meme. Please try again.');
  }
};
