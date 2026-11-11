const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @body    { name, description, user_id }
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, user_id } = req.body;

    if (!name || !user_id) {
      return res.status(400).json({
        success: false,
        error: 'name and user_id are required fields',
      });
    }

    // Verify user exists before creating project
    const userExists = await prisma.user.findUnique({
      where: { id: user_id },
    });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: `User with id '${user_id}' does not exist`,
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        user_id,
      },
    });

    return res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while creating project',
      details: error.message,
    });
  }
});

/**
 * @route   GET /api/projects
 * @desc    Fetch all projects (optional query: ?user_id=...)
 */
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;

    const projects = await prisma.project.findMany({
      where: user_id ? { user_id } : undefined,
      include: {
        _count: {
          select: { prompts: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching projects',
      details: error.message,
    });
  }
});

/**
 * @route   GET /api/projects/:projectId
 * @desc    Fetch a single project with its prompt history
 */
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        user: {
          select: { id: true, email: true, username: true },
        },
        prompts: {
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: `Project with id '${projectId}' not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching project',
      details: error.message,
    });
  }
});

/**
 * @route   POST /api/projects/:projectId/prompts
 * @desc    Save a new prompt version for a specific project
 * @body    { prompt_text, negative_prompt, image_url, settings }
 */
router.post('/:projectId/prompts', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { prompt_text, negative_prompt, image_url, settings } = req.body;

    if (!prompt_text) {
      return res.status(400).json({
        success: false,
        error: 'prompt_text is required',
      });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: `Project with id '${projectId}' not found`,
      });
    }

    // Determine the next version number for this project
    const latestPrompt = await prisma.prompt.findFirst({
      where: { project_id: projectId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const nextVersion = latestPrompt ? latestPrompt.version + 1 : 1;

    // Create prompt record
    const newPrompt = await prisma.prompt.create({
      data: {
        project_id: projectId,
        prompt_text,
        negative_prompt: negative_prompt || null,
        image_url: image_url || null,
        settings: settings || {},
        version: nextVersion,
      },
    });

    return res.status(201).json({
      success: true,
      message: `Prompt version v${nextVersion} created successfully`,
      data: newPrompt,
    });
  } catch (error) {
    console.error('Error creating prompt:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while creating prompt',
      details: error.message,
    });
  }
});

/**
 * @route   GET /api/projects/:projectId/prompts
 * @desc    Fetch all prompt versions for a specific project
 */
router.get('/:projectId/prompts', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify project exists
    const projectExists = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!projectExists) {
      return res.status(404).json({
        success: false,
        error: `Project with id '${projectId}' not found`,
      });
    }

    // Retrieve prompts ordered by newest version first, with parent relationship
    const prompts = await prisma.prompt.findMany({
      where: { project_id: projectId },
      include: {
        parent: {
          select: {
            id: true,
            version: true,
            prompt_text: true,
          },
        },
        _count: {
          select: { branches: true },
        },
      },
      orderBy: { version: 'desc' },
    });

    return res.status(200).json({
      success: true,
      count: prompts.length,
      data: prompts,
    });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching prompts',
      details: error.message,
    });
  }
});

module.exports = router;
