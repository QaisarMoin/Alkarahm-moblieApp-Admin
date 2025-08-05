import express from 'express';
import { Router } from 'express';
import { search, getSearchSuggestions, advancedSearch } from '../controllers/searchController.js';

const router = Router();

// Search endpoint
router.get('/', search);

// Search suggestions endpoint
router.get('/suggestions', getSearchSuggestions);

// Advanced search endpoint
router.get('/advanced', advancedSearch);

export default router;