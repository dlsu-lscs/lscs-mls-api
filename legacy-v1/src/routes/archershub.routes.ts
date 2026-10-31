import { Router } from 'express';
import * as ArchersHubController from 'controllers/archershub.controller.js';

const router = Router();

router.get('/campuses', ArchersHubController.getCampuses);
router.get('/terms', ArchersHubController.getTerms);
router.get('/courses/list', ArchersHubController.getCourseList);

export default router;
