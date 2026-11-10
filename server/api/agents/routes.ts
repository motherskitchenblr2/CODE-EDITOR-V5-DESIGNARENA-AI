// ============================================================================
// Volt Code AGI - Agent API Routes
// ============================================================================

import { Router } from 'express';
import * as agentController from './controller';

const router = Router();

// ==========================================================================
// Agent Routes
// ==========================================================================

// GET /agents - Get all agents
router.get('/', agentController.getAllAgents);

// GET /agents/:id - Get agent by ID
router.get('/:id', agentController.getAgentById);

// GET /agents/tab/:tab - Get agents by tab
router.get('/tab/:tab', agentController.getAgentsByTab);

// GET /agents/type/:type - Get agents by type
router.get('/type/:type', agentController.getAgentsByType);

// ==========================================================================
// Task Routes
// ==========================================================================

// GET /agents/tasks - Get all tasks
router.get('/tasks', agentController.getAllTasks);

// GET /agents/tasks/:id - Get task by ID
router.get('/tasks/:id', agentController.getTaskById);

// POST /agents/tasks - Create a new task
router.post('/tasks', agentController.createTask);

// PUT /agents/tasks/:id - Update a task
router.put('/tasks/:id', agentController.updateTask);

// DELETE /agents/tasks/:id - Delete a task
router.delete('/tasks/:id', agentController.deleteTask);

// ==========================================================================
// Message Routes
// ==========================================================================

// GET /agents/messages - Get all messages
router.get('/messages', agentController.getAllMessages);

// GET /agents/messages/:id - Get message by ID
router.get('/messages/:id', agentController.getMessageById);

// POST /agents/messages - Create a new message
router.post('/messages', agentController.createMessage);

// PUT /agents/messages/:id/read - Mark message as read
router.put('/messages/:id/read', agentController.markMessageAsRead);

// ==========================================================================
// Collaboration Routes
// ==========================================================================

// GET /agents/collaborations - Get all collaborations
router.get('/collaborations', agentController.getAllCollaborations);

// GET /agents/collaborations/:id - Get collaboration by ID
router.get('/collaborations/:id', agentController.getCollaborationById);

// POST /agents/collaborations - Create a new collaboration
router.post('/collaborations', agentController.createCollaboration);

// ==========================================================================
// Stats Routes
// ==========================================================================

// GET /agents/stats - Get system stats
router.get('/stats', agentController.getSystemStats);

// GET /agents/stats/:agentId - Get agent stats
router.get('/stats/:agentId', agentController.getAgentStats);

// ==========================================================================
// Health Check
// ==========================================================================

// GET /agents/health - Agent system health
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    message: 'Agent API is running',
  });
});

export { router as agentRouter };
