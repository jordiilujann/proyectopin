import { Router } from 'express';
import * as reviewController from '../controllers/reviewController.js';

const router = Router();

router.get('/:spotifyId', reviewController.getReviewsCtrl);

router.post('/', reviewController.createReviewCtrl);

export default router;