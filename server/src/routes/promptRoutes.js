const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { generateAndSavePrompt } = require('../controllers/generationController');

/**
 * @route   POST /api/prompts/generate
 * @desc    Generate image via OpenAI DALL-E 3 REST API & persist prompt to PostgreSQL
 * @body    { project_id, prompt_text, negative_prompt, settings, parent_id, branch_label }
 */
router.post('/generate', generateAndSavePrompt);

/**
 * @route   POST /api/prompts
 * @desc    Save a new root prompt version (project_id in body)
 * @body    { project_id, prompt_text, negative_prompt, image_url, settings, parent_id, branch_label }
 */
router.post('/', async (req, res) => {
  try {
    const { project_id, prompt_text, negative_prompt, image_url, settings, parent_id, branch_label } = req.body;

    if (!project_id || !prompt_text) {
      return res.status(400).json({
        success: false,
        error: 'project_id and prompt_text are required fields',
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: project_id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: `Project with id '${project_id}' not found`,
      });
    }

    // Verify parent_id if provided
    if (parent_id) {
      const parentExists = await prisma.prompt.findUnique({
        where: { id: parent_id },
      });
      if (!parentExists) {
        return res.status(404).json({
          success: false,
          error: `Parent prompt with id '${parent_id}' not found`,
        });
      }
    }

    const latestPrompt = await prisma.prompt.findFirst({
      where: { project_id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const nextVersion = latestPrompt ? latestPrompt.version + 1 : 1;

    const newPrompt = await prisma.prompt.create({
      data: {
        project_id,
        parent_id: parent_id || null,
        prompt_text,
        negative_prompt: negative_prompt || null,
        image_url: image_url || null,
        settings: settings || {},
        version: nextVersion,
        branch_label: branch_label || null,
      },
      include: {
        parent: {
          select: {
            id: true,
            version: true,
            prompt_text: true,
          },
        },
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
 * @route   POST /api/prompts/:id/branch
 * @desc    'Branch from here': Branch an existing prompt version with tweaks
 * @param   id - The parent prompt ID to branch from
 * @body    { prompt_text, negative_prompt, image_url, settings, branch_label }
 */
router.post('/:id/branch', async (req, res) => {
  try {
    const { id: parentId } = req.params;
    const { prompt_text, negative_prompt, image_url, settings, branch_label } = req.body;

    if (!prompt_text || !prompt_text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'prompt_text is required to create a branch',
      });
    }

    // 1. Fetch parent prompt to verify existence and retrieve baseline data
    const parentPrompt = await prisma.prompt.findUnique({
      where: { id: parentId },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    if (!parentPrompt) {
      return res.status(404).json({
        success: false,
        error: `Parent prompt with id '${parentId}' not found`,
      });
    }

    // 2. Calculate next project-level version number
    const latestPrompt = await prisma.prompt.findFirst({
      where: { project_id: parentPrompt.project_id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const nextVersion = latestPrompt ? latestPrompt.version + 1 : 1;

    // 3. Inherit parent negative prompt if none provided
    const effectiveNegativePrompt = negative_prompt !== undefined
      ? negative_prompt
      : parentPrompt.negative_prompt;

    // 4. Merge parent settings with new modifications
    const parentSettings = parentPrompt.settings && typeof parentPrompt.settings === 'object'
      ? parentPrompt.settings
      : {};
    const inputSettings = settings && typeof settings === 'object'
      ? settings
      : {};
    const mergedSettings = { ...parentSettings, ...inputSettings };

    // 5. Create new prompt using parentId as parent_id
    const branchedPrompt = await prisma.prompt.create({
      data: {
        project_id: parentPrompt.project_id,
        parent_id: parentId, // Establish branch link
        prompt_text: prompt_text.trim(),
        negative_prompt: effectiveNegativePrompt || null,
        image_url: image_url || null,
        settings: mergedSettings,
        version: nextVersion,
        branch_label: branch_label || `branch-v${parentPrompt.version}`,
      },
      include: {
        parent: {
          select: {
            id: true,
            version: true,
            prompt_text: true,
            settings: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: `Successfully created branch v${nextVersion} from parent prompt v${parentPrompt.version}`,
      data: branchedPrompt,
    });
  } catch (error) {
    console.error('Error branching prompt:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while branching prompt',
      details: error.message,
    });
  }
});

/**
 * @route   GET /api/prompts/:id
 * @desc    Get a single prompt version with its parent and all direct branches
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const prompt = await prisma.prompt.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            version: true,
            prompt_text: true,
            branch_label: true,
          },
        },
        branches: {
          select: {
            id: true,
            version: true,
            prompt_text: true,
            branch_label: true,
            image_url: true,
            created_at: true,
          },
          orderBy: { version: 'desc' },
        },
        project: {
          select: { id: true, name: true, user_id: true },
        },
      },
    });

    if (!prompt) {
      return res.status(404).json({
        success: false,
        error: `Prompt with id '${id}' not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: prompt,
    });
  } catch (error) {
    console.error('Error fetching prompt:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching prompt',
      details: error.message,
    });
  }
});

/**
 * @route   DELETE /api/prompts/:id
 * @desc    Delete a specific prompt version
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const prompt = await prisma.prompt.findUnique({
      where: { id },
    });

    if (!prompt) {
      return res.status(404).json({
        success: false,
        error: `Prompt with id '${id}' not found`,
      });
    }

    await prisma.prompt.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: `Prompt '${id}' deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while deleting prompt',
      details: error.message,
    });
  }
});

module.exports = router;
