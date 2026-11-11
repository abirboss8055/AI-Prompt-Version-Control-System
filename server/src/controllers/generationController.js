const axios = require('axios');
const prisma = require('../lib/prisma');

/**
 * @desc    Generate image via OpenAI DALL-E 3 REST API & persist prompt version to PostgreSQL
 * @route   POST /api/prompts/generate
 * @access  Public
 */
async function generateAndSavePrompt(req, res) {
  try {
    const {
      project_id,
      prompt_text,
      negative_prompt,
      settings = {},
      parent_id,
      branch_label,
    } = req.body;

    // 1. Basic input validation
    if (!project_id) {
      return res.status(400).json({
        success: false,
        error: 'project_id is required',
      });
    }

    if (!prompt_text || !prompt_text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'prompt_text is required for image generation',
      });
    }

    // 2. Validate environment configuration
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Server misconfiguration: OPENAI_API_KEY is missing in .env file',
      });
    }

    // 3. Verify the project exists in PostgreSQL
    const project = await prisma.project.findUnique({
      where: { id: project_id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: `Project with id '${project_id}' was not found`,
      });
    }

    // 4. Verify parent prompt if branching
    if (parent_id) {
      const parentExists = await prisma.prompt.findUnique({
        where: { id: parent_id },
      });
      if (!parentExists) {
        return res.status(404).json({
          success: false,
          error: `Parent prompt with id '${parent_id}' was not found`,
        });
      }
    }

    // 5. Configure OpenAI DALL-E 3 request parameters
    const model = settings.model || 'dall-e-3';
    const size = settings.size || '1024x1024'; // Options: 1024x1024, 1024x1792, 1792x1024
    const quality = settings.quality || 'standard'; // Options: standard, hd
    const style = settings.style || 'vivid'; // Options: vivid, natural

    const openAiPayload = {
      model,
      prompt: prompt_text.trim(),
      n: 1,
      size,
      quality,
      style,
      response_format: 'url',
    };

    console.log(`[OpenAI] Sending generation request to DALL-E 3 for project: ${project_id}...`);

    // 6. Call OpenAI Image Generation REST API
    let openAiResponse;
    try {
      openAiResponse = await axios.post(
        'https://api.openai.com/v1/images/generations',
        openAiPayload,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60s timeout for model inference
        }
      );
    } catch (apiError) {
      console.error('[OpenAI API Error]:', apiError.response?.data || apiError.message);
      
      const statusCode = apiError.response?.status || 502;
      const errorMessage =
        apiError.response?.data?.error?.message ||
        'Failed to generate image from OpenAI REST API';

      return res.status(statusCode).json({
        success: false,
        error: errorMessage,
        provider: 'openai',
      });
    }

    // 7. Extract generated image URL and revised prompt from response
    const generatedData = openAiResponse.data?.data?.[0];
    const generatedImageUrl = generatedData?.url;
    const revisedPrompt = generatedData?.revised_prompt;

    if (!generatedImageUrl) {
      return res.status(502).json({
        success: false,
        error: 'OpenAI returned an empty image URL response',
      });
    }

    // 8. Determine next project version number
    const latestPrompt = await prisma.prompt.findFirst({
      where: { project_id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const nextVersion = latestPrompt ? latestPrompt.version + 1 : 1;

    // 9. Prepare merged JSONB settings payload
    const finalSettings = {
      ...settings,
      provider: 'openai',
      model,
      size,
      quality,
      style,
      revised_prompt: revisedPrompt || null,
      generated_at: new Date().toISOString(),
    };

    // 10. Persist complete record into Prisma PostgreSQL database
    const savedPrompt = await prisma.prompt.create({
      data: {
        project_id,
        parent_id: parent_id || null,
        prompt_text: prompt_text.trim(),
        negative_prompt: negative_prompt || null,
        image_url: generatedImageUrl,
        settings: finalSettings,
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
        project: {
          select: {
            id: true,
            name: true,
            user_id: true,
          },
        },
      },
    });

    // 11. Return the complete saved database record to client
    return res.status(201).json({
      success: true,
      message: `Image generated and saved as prompt version v${nextVersion}`,
      data: savedPrompt,
    });
  } catch (error) {
    console.error('Unhandled error during generateAndSavePrompt:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while processing image generation',
      details: error.message,
    });
  }
}

module.exports = {
  generateAndSavePrompt,
};
