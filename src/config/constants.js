// src/config/constants.js

/**
 * Application Constants
 * Centralized location for all app-wide constants
 */

export const ASSETS = {
  LEONARD_AVATAR: '/images/leonard-avatar.jpg',
  PLACEHOLDER_IMAGE: 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?q=80&w=800&auto=format&fit=crop'
};

export const API_ENDPOINTS = {
  GENERATE_PLAN: '/api/generate-plan',
  GET_SERVICES: '/api/get-services'
};

export const SERVICE_CATEGORIES = [
  'marina',
  'mechanic',
  'fuel',
  'provisions',
  'crew',
  'restaurant',
  'concierge'
];

export const SUPPORTED_LANGUAGES = {
  'en-US': 'English',
  'fr': 'Français',
  'es': 'Español'
};