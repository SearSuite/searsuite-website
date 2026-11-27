import { readFileSync, writeFileSync } from 'node:fs';
import { commentsIn, packageSourceFiles, workspacePath } from '../../searsuite/scripts/source-comments.mjs';

const runtimeDescriptions = new Map([
  ['AggregationCache', 'Caches incremental aggregate results for large formula ranges.'],
  ['Cell', 'Base render node for a projected Sheet cell.'],
  ['Container', 'Scene node that owns, queries, and serializes an ordered child collection.'],
  ['DependencyGraph', 'Tracks formula dependencies, dirty propagation, evaluation readiness, and cycles.'],
  ['FormulaCell', 'Renders the calculated projection of a formula cell.'],
  ['FormulaEvaluator', 'Evaluates parsed formulas against an explicit host-provided context.'],
  ['FormulaParser', 'Parses formula source and rewrites structural references.'],
  ['FormulaRefShifter', 'Rewrites formula references after Sheet structure changes.'],
  ['FormulaResultStore', 'Stores calculated formula results independently from persisted formula source.'],
  ['RecalcScheduler', 'Schedules dependency-aware formula recalculation with visible-cell priority.'],
  ['RenderEngine', 'Schedules frames and applies a render strategy to the current scene.'],
  ['SearCoreDoc', 'Stages and commits rich-document transactions for one editor runtime.'],
  ['SheetCellEditorPlugin', 'Coordinates Sheet cell edit sessions, text input, and embedded editors.'],
  ['SheetCursorPlugin', 'Projects Sheet interaction state into host cursor behavior.'],
  ['SheetFormulaPlugin', 'Owns formula source, dependency tracking, recalculation, and result projection.'],
  ['SheetRenderCoordinatorManager', 'Coordinates cell projection and rendering for a Sheet frame.'],
  ['SheetRenderEngine', 'Coordinates Sheet invalidation, frame scheduling, and screen-cache reuse.'],
  ['SheetResizePlugin', 'Owns row and column resize state, interaction, and visual feedback.'],
  ['SheetSelectionPlugin', 'Owns Sheet selections, navigation, commands, and observations.'],
  ['TextInput', 'Routes host text and composition input through portable subscriptions.'],
  ['WebScroller', 'Adapts a Web scroll surface to logical editor viewport coordinates.'],
]);

const memberDescriptions = new Map([
  ['add event listener', 'Registers a host event listener and returns an idempotent disposer.'],
  ['begin path', 'Begins a recorded vector path.'],
  ['bottom', 'The lower boundary of this node in parent coordinates.'],
  ['cancel animation frame', 'Cancels a previously scheduled host animation frame.'],
  ['cancel edit', 'Cancels the active cell edit session without committing its draft.'],
  ['capacity', 'The maximum number of entries retained by this spatial node.'],
  ['children', 'The direct scene children in paint order.'],
  ['clear interval', 'Cancels a repeating host timer.'],
  ['clear rect', 'Records a rectangular clear operation.'],
  ['clear timeout', 'Cancels a one-shot host timer.'],
  ['clip', 'Clips subsequent recorded operations to the current path.'],
  ['clone', 'Creates an independent copy of this value and its mutable data.'],
  ['clone node', 'Creates an independent copy of a recorded render node.'],
  ['close path', 'Closes the current recorded vector path.'],
  ['code', 'Stable machine-readable identifier for this error category.'],
  ['commit edit', 'Commits the active cell edit session through its owning command.'],
  ['connect', 'Opens the collaboration transport and begins receiving messages.'],
  ['delete', 'Removes the calculated result for one formula cell.'],
  ['descendants', 'Iterates every descendant in scene order.'],
  ['disconnect', 'Closes the collaboration transport and releases its listeners.'],
  ['draw hit', 'Draws this handle into the hit-test context.'],
  ['draw image', 'Records an image draw operation using the supplied source and bounds.'],
  ['draw scene', 'Draws this handle into the visible scene context.'],
  ['fill', 'Fills the current path or exposes the node fill paint, depending on the render contract.'],
  ['fill text', 'Records text painting at the supplied position.'],
  ['highlight', 'Returns highlighted segments for the supplied source range.'],
  ['highlight provider key', 'Stable key for the formula-reference highlight contribution.'],
  ['horizontal align', 'Horizontal alignment used when positioning this node.'],
  ['initialize', 'Initializes the recording context for a render target.'],
  ['insert', 'Inserts a bounded entry into the spatial index.'],
  ['invalidate screen cache', 'Drops retained screen content so the next frame repaints it.'],
  ['left', 'The left boundary of this node in parent coordinates.'],
  ['line dash', 'Dash pattern used when stroking this node.'],
  ['line to', 'Adds a line segment to the current recorded path.'],
  ['mark dirty', 'Marks a region or the current scene for rendering on the next frame.'],
  ['measure text', "Measures text with the recording context's configured metrics."],
  ['mount', 'Attaches this adapter to its host surface.'],
  ['move to', 'Moves the current recorded path without drawing a segment.'],
  ['name', 'Stable matrix name used in diagnostics and serialized metadata.'],
  ['navigate', 'Moves the current Sheet selection according to the requested direction.'],
  ['navigate down', 'Moves the current Sheet selection to the next selectable row.'],
  ['now', "Returns the host's monotonic time in milliseconds."],
  ['observe resize', 'Observes host-view size changes and returns an idempotent disposer.'],
  ['override', 'Applies a temporary host cursor override.'],
  ['parent', 'The parent spatial node, or null at the root.'],
  ['pending count', 'Number of dirty formulas still awaiting evaluation.'],
  ['put image data', 'Records raw pixel data at the supplied position.'],
  ['queue microtask', 'Schedules a callback in the host microtask queue.'],
  ['rect', 'Adds a rectangle to the current recorded path.'],
  ['refocus', 'Restores focus to the hidden host text-input surface.'],
  ['register', 'Registers a formula function under its canonical and compatible names.'],
  ['render cell', 'Projects and renders one visible Sheet cell.'],
  ['request animation frame', 'Schedules a callback for the next host animation frame.'],
  ['reset transform', 'Restores the recorded transform to the identity matrix.'],
  ['resize', 'Resizes the render target and invalidates dependent frame state.'],
  ['resolve', 'Resolves a dependency from this container and its parent scope.'],
  ['restart navigation', 'Restarts selection navigation from the current active cell.'],
  ['restore', 'Restores the most recently saved render state.'],
  ['right', 'The right boundary of this node in parent coordinates.'],
  ['root', 'The host element that owns the scroll surface.'],
  ['save', 'Pushes the current render state onto the recording stack.'],
  ['send', 'Sends one encoded collaboration message through the transport.'],
  ['sheet cell merge plugin', 'Optional merge capability used to normalize selection movement.'],
  ['size', 'Number of formula nodes currently registered in the graph.'],
  ['start listener', 'Starts forwarding host text and composition events.'],
  ['sticky', 'Whether this node remains fixed while its scroll container moves.'],
  ['stop', 'Stops the active cursor blink cycle and clears its timer.'],
  ['stop listener', 'Stops forwarding host text and composition events.'],
  ['stroke', 'Strokes the current recorded path.'],
  ['stroke rect', 'Records a stroked rectangle operation.'],
  ['stroke width', 'Stroke width used when painting this node.'],
  ['subscribe', 'Subscribes to state changes and returns an idempotent disposer.'],
  ['to json', 'Serializes this scene structure into diagnostic JSON.'],
  ['top', 'The upper boundary of this node in parent coordinates.'],
  ['transform component x', 'Transforms one Matrix OT component against another concurrent component.'],
  ['transform x', 'Transforms one Matrix OT operation against a concurrent operation.'],
  ['transform', 'Transforms concurrent Matrix OT operations into a convergent pair.'],
  ['translate', 'Offsets subsequent recorded operations by the supplied vector.'],
  ['types', 'Registered dependency tokens owned by this container.'],
  ['unmount', 'Detaches this adapter from its host surface.'],
  ['update boundary', 'Updates the indexed boundary after geometry changes.'],
  ['vertical align', 'Vertical alignment used when positioning this node.'],
  ['warn', 'Reports a non-fatal diagnostic through the host warning channel.'],
]);

const ownerMemberDescriptions = new Map([
  ['CellCommitStrategy.key', 'Stable identifier for this commit strategy.'],
  ['DefaultStringCellCommitStrategy.key', 'Stable identifier for the default string strategy.'],
  ['EmptyCellCommitStrategy.key', 'Stable identifier for the empty-cell strategy.'],
  ['FormulaCellCommitStrategy.key', 'Stable identifier for the formula strategy.'],
  ['NumberCellCommitStrategy.key', 'Stable identifier for the number strategy.'],
  ['RichTextCellCommitStrategy.key', 'Stable identifier for the rich-text strategy.'],
  ['TextCellCommitStrategy.key', 'Stable identifier for the explicit text strategy.'],
  ['CellCommitStrategy.priority', 'Ordering priority used when more than one strategy matches.'],
  ['DefaultStringCellCommitStrategy.priority', 'Ordering priority for the default string fallback.'],
  ['EmptyCellCommitStrategy.priority', 'Ordering priority for empty input.'],
  ['FormulaCellCommitStrategy.priority', 'Ordering priority for formula input.'],
  ['NumberCellCommitStrategy.priority', 'Ordering priority for numeric input.'],
  ['RichTextCellCommitStrategy.priority', 'Ordering priority for rich-text input.'],
  ['TextCellCommitStrategy.priority', 'Ordering priority for explicit text input.'],
  ['CellCommitStrategy.matches', 'Reports whether this strategy can commit the supplied input.'],
  ['DefaultStringCellCommitStrategy.matches', 'Matches input not claimed by a more specific strategy.'],
  ['EmptyCellCommitStrategy.matches', 'Reports whether the input should clear the cell.'],
  ['FormulaCellCommitStrategy.matches', 'Reports whether the input is formula source.'],
  ['NumberCellCommitStrategy.matches', 'Reports whether the input is a valid numeric value.'],
  ['RichTextCellCommitStrategy.matches', 'Reports whether the input is a rich-document snapshot.'],
  ['TextCellCommitStrategy.matches', 'Reports whether the input is explicitly typed as text.'],
  ['CellCommitStrategy.commit', 'Converts matching edit input into a persisted cell value.'],
  ['CellCommitStrategyRegistry.commit', 'Selects a matching strategy and commits the supplied edit input.'],
  ['DefaultStringCellCommitStrategy.commit', 'Persists unmatched input as a string cell.'],
  ['EmptyCellCommitStrategy.commit', 'Converts empty input into an absent cell value.'],
  ['FormulaCellCommitStrategy.commit', 'Persists formula source without evaluating it.'],
  ['NumberCellCommitStrategy.commit', 'Persists input as a numeric cell.'],
  ['RichTextCellCommitStrategy.commit', 'Persists a cloned rich-document snapshot.'],
  ['TextCellCommitStrategy.commit', 'Persists input as an explicit text cell.'],
  ['Container.query', 'Returns descendants whose boundaries intersect the supplied rectangle.'],
  ['FrameDirtyTracker.query', 'Returns dirty nodes for the requested render generation.'],
  ['Tree.query', 'Returns indexed entries whose boundaries intersect the supplied rectangle.'],
]);

const hanCommentReplacements = new Map([
  ['Returns trailing text by DBCS byte count.', 'Returns trailing text limited by a locale-defined DBCS byte count.'],
  ['Reads a translation from the host cache.', 'Reads a previously loaded translation from the host cache.'],
  ['Returns text from a DBCS byte position.', 'Returns text from a locale-defined DBCS byte position.'],
  ['Replaces text at a DBCS byte position.', 'Replaces text at a locale-defined DBCS byte position.'],
  [
    'Finds case-sensitive text at a DBCS byte position.',
    'Finds case-sensitive text using locale-defined DBCS byte positions.',
  ],
  ['Returns leading text by DBCS byte count.', 'Returns leading text limited by a locale-defined DBCS byte count.'],
  [
    'Finds case-insensitive text at a DBCS byte position.',
    'Finds case-insensitive text using locale-defined DBCS byte positions.',
  ],
  ['Returns text length in locale-defined DBCS bytes.', 'Returns text length measured in locale-defined DBCS bytes.'],
  [
    'NUMBERSTRING converts a number to Chinese text.',
    'Converts a number to one of the supported Chinese numeral styles.',
  ],
  [
    'IF: Selects one value when a condition is true and another when it is false.',
    'Returns one value when a condition is true and another when it is false.',
  ],
  [
    'SUMIFS: Adds values that satisfy multiple conditions.',
    'Sums values whose corresponding ranges satisfy every criterion.',
  ],
]);

function normalizeComment(comment) {
  const runtime = comment.match(/^\/\*\*\s*([A-Za-z0-9_]+) runtime API\.\s*\*\/$/s);
  if (runtime) {
    const description = runtimeDescriptions.get(runtime[1]);
    if (!description) throw new Error(`No runtime description for ${runtime[1]}.`);
    return `/** ${description} */`;
  }

  const member = comment.match(/^\/\*\*\s*Public ([a-z ]+) member for ([A-Za-z0-9_]+)\.\s*\*\/$/s);
  if (member) {
    const description = ownerMemberDescriptions.get(`${member[2]}.${member[1]}`) ?? memberDescriptions.get(member[1]);
    if (!description) throw new Error(`No member description for ${member[2]}.${member[1]}.`);
    return `/** ${description} */`;
  }

  if (!/\p{Script=Han}/u.test(comment)) return comment;
  const firstSentence = [...hanCommentReplacements.keys()].find((candidate) => comment.includes(candidate));
  if (!firstSentence) throw new Error(`No English replacement for comment: ${comment}`);
  const replacement = hanCommentReplacements.get(firstSentence);
  if (comment.startsWith('/**') && comment.endsWith('*/')) return `/** ${replacement} */`;
  return comment.replace(comment, `/** ${replacement} */`);
}

let changedFiles = 0;
for (const file of packageSourceFiles()) {
  const source = readFileSync(file, 'utf8');
  const replacements = [];

  for (const comment of commentsIn(file)) {
    const text = comment.text;
    const normalized = normalizeComment(text);
    if (normalized !== text) replacements.push({ end: comment.end, start: comment.start, normalized });
  }

  if (!replacements.length) continue;
  let output = source;
  for (const replacement of replacements.reverse()) {
    output = `${output.slice(0, replacement.start)}${replacement.normalized}${output.slice(replacement.end)}`;
  }
  writeFileSync(file, output);
  changedFiles += 1;
  console.log(`Normalized ${replacements.length} comment(s) in ${workspacePath(file)}.`);
}

console.log(`Normalized source documentation in ${changedFiles} file(s).`);
