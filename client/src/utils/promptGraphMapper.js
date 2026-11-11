/**
 * Utility function to transform a flat list of PostgreSQL / Prisma prompt objects
 * (with self-referencing parent_id fields) into React Flow nodes and edges.
 *
 * It automatically calculates 2D hierarchical coordinates (depth & breadth)
 * so child branches visually branch out from their parent without overlapping.
 *
 * @param {Array<Object>} prompts - Flat array of prompt records
 * @param {Object} [options] - Layout options
 * @param {'LR' | 'TB'} [options.direction='LR'] - 'LR' (Left to Right) or 'TB' (Top to Bottom)
 * @param {number} [options.nodeWidth=260] - Width of each node card
 * @param {number} [options.nodeHeight=140] - Height of each node card
 * @param {number} [options.spacingX=120] - Horizontal spacing between branches
 * @param {number} [options.spacingY=70] - Vertical spacing between branches
 * @returns {{ nodes: Array<Object>, edges: Array<Object> }} React Flow nodes and edges
 */
export function mapPromptsToGraph(prompts = [], options = {}) {
  const {
    direction = 'LR',
    nodeWidth = 260,
    nodeHeight = 140,
    spacingX = 120,
    spacingY = 70,
  } = options;

  if (!Array.isArray(prompts) || prompts.length === 0) {
    return { nodes: [], edges: [] };
  }

  // 1. Build lookup tables for IDs and parent-child hierarchy
  const promptMap = new Map();
  const childrenMap = new Map();

  prompts.forEach((prompt) => {
    promptMap.set(prompt.id, prompt);
    childrenMap.set(prompt.id, []);
  });

  const rootIds = [];

  prompts.forEach((prompt) => {
    if (prompt.parent_id && promptMap.has(prompt.parent_id)) {
      childrenMap.get(prompt.parent_id).push(prompt.id);
    } else {
      rootIds.push(prompt.id);
    }
  });

  // 2. Calculate tree layout positions (depth & row index)
  const nodePositions = new Map();
  let currentBreadth = 0;

  function layoutSubtree(nodeId, depth = 0) {
    const childIds = childrenMap.get(nodeId) || [];

    if (childIds.length === 0) {
      // Leaf node: allocate a new breadth slot
      const pos = { depth, breadth: currentBreadth };
      nodePositions.set(nodeId, pos);
      currentBreadth += 1;
      return pos;
    }

    // Layout all children first (bottom-up centering)
    const childPositions = childIds.map((childId) => layoutSubtree(childId, depth + 1));

    // Center the parent node vertically between its topmost and bottommost children
    const minBreadth = childPositions[0].breadth;
    const maxBreadth = childPositions[childPositions.length - 1].breadth;
    const centerBreadth = (minBreadth + maxBreadth) / 2;

    const pos = { depth, breadth: centerBreadth };
    nodePositions.set(nodeId, pos);
    return pos;
  }

  // Layout each root tree
  rootIds.forEach((rootId) => {
    layoutSubtree(rootId, 0);
  });

  // Fallback for any orphaned nodes that were not reachable
  prompts.forEach((prompt) => {
    if (!nodePositions.has(prompt.id)) {
      nodePositions.set(prompt.id, { depth: 0, breadth: currentBreadth++ });
    }
  });

  // 3. Map to React Flow Nodes
  const nodes = prompts.map((prompt) => {
    const pos = nodePositions.get(prompt.id);

    const x = direction === 'LR'
      ? pos.depth * (nodeWidth + spacingX)
      : pos.breadth * (nodeWidth + spacingX);

    const y = direction === 'LR'
      ? pos.breadth * (nodeHeight + spacingY)
      : pos.depth * (nodeHeight + spacingY);

    return {
      id: prompt.id,
      type: 'promptNode',
      position: { x, y },
      data: {
        id: prompt.id,
        version: prompt.version,
        prompt_text: prompt.prompt_text,
        negative_prompt: prompt.negative_prompt,
        image_url: prompt.image_url,
        settings: prompt.settings || {},
        parent_id: prompt.parent_id,
        branch_label: prompt.branch_label,
        created_at: prompt.created_at,
        isRoot: !prompt.parent_id,
        direction,
      },
    };
  });

  // 4. Map to React Flow Edges
  const edges = [];
  prompts.forEach((prompt) => {
    if (prompt.parent_id && promptMap.has(prompt.parent_id)) {
      edges.push({
        id: `edge-${prompt.parent_id}-${prompt.id}`,
        source: prompt.parent_id,
        target: prompt.id,
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: '#8b5cf6',
          strokeWidth: 2,
        },
        label: prompt.branch_label ? `#${prompt.branch_label}` : undefined,
        labelStyle: {
          fill: '#c4b5fd',
          fontSize: 10,
          fontFamily: 'monospace',
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: '#0f172a',
          fillOpacity: 0.95,
        },
        labelBgPadding: [6, 3],
        labelBgBorderRadius: 4,
      });
    }
  });

  return { nodes, edges };
}
