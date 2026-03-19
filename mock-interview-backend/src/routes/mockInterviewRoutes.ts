import { Router } from 'express';
import multer from 'multer';
import {
  answerQuestion,
  createSession,
  finalizeSession,
  getSession,
  listSessions,
} from '../controllers/mockInterviewController.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get('/sessions', listSessions);
router.get('/sessions/:sessionId', getSession);
router.post('/sessions', createSession);
router.post('/sessions/:sessionId/questions/:questionId/answer', upload.single('audio'), answerQuestion);
router.post('/sessions/:sessionId/finalize', finalizeSession);

export default router;
