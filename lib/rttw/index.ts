import { EditorView, basicSetup } from 'codemirror';
import { Text, Compartment, EditorSelection, EditorState, Facet, StateEffect } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { season1, Puzzle } from './puzzles';

const root: HTMLElement = document.querySelector('#app-rttw')!;
// TODO: better theme
root.style.background = '#fff';
root.style.color = '#000';

interface PuzzleFacet {
  prefix: string;
  suffix: string;
}

const defaultPuzzle = () => ({ prefix: '-->', suffix: '<--' });
const puzzleCompartment = new Compartment();
const puzzleFacet = Facet.define<PuzzleFacet, PuzzleFacet>({
  combine: (input) => (input.length ? input[0] : defaultPuzzle()),
});

// NOTE: this stops mdbook's keyboard handlers from running when the user is
// using codemirror
root.addEventListener('keydown', (event) => event.stopPropagation());

// Setup puzzle selector
const puzzleSelector = root.appendChild(document.createElement('select'));
puzzleSelector.addEventListener('change', () => {
  view.setState(initializePuzzle());
  view.focus();
});
puzzleSelector.append(
  ...season1.map((puzzle) => {
    const option = document.createElement<'option'>('option');
    option.value = puzzle.name;
    option.textContent = puzzle.name;
    return option;
  })
);

function runInBrowser(input: string) {
  try {
    const value = eval(input);
    return value;
  } catch (err) {
    return err instanceof Error ? err.message : err.toString();
  }
}

function getPuzzle() {
  const puzzle = season1.find((p) => p.name === puzzleSelector.value);
  if (!puzzle) {
    throw new Error(`Failed to find puzzle, select value: ${puzzleSelector.value}`);
  }

  return puzzle;
}

function createPuzzleState(puzzle: Puzzle, resultText: string, solutionLen: number): PuzzleFacet {
  const prefix = `// This is your function...\n${puzzle.source}\n\n// ... now make it return \`true\`!\n${puzzle.name}(`;
  const suffix = `);\n\n// Result: ${resultText}\n// Length: ${solutionLen}`;
  return { prefix, suffix };
}

function initializePuzzle(): EditorState {
  const puzzle = getPuzzle();
  const puzzleState = createPuzzleState(puzzle, '<no input>', 0);

  return EditorState.create({
    doc: puzzleState.prefix + puzzleState.suffix,
    extensions: [
      basicSetup,
      javascript(),
      puzzleCompartment.of(puzzleFacet.of(puzzleState)),
      readOnlySections,
      onChangeHandler,
    ],
  });
}

function updatePuzzle(solution: string): StateEffect<unknown> {
  const puzzle = getPuzzle();
  const result = runInBrowser(`${puzzle.source}\n${puzzle.name}(${solution});`);
  const resultText = result === true ? `${result} 🎉` : result ?? '<no input>';
  const solutionLen = solution.replace(/\s/g, '').length;
  return puzzleCompartment.reconfigure(puzzleFacet.of(createPuzzleState(puzzle, resultText, solutionLen)));
}

interface Bounds {
  from: number;
  to: number;
}

const makeClipper = (bounds: Bounds) => (n: number) => Math.min(Math.max(n, bounds.from), bounds.to);
const getBounds = ({ prefix, suffix }: PuzzleFacet, docLength: number): Bounds => ({
  from: Math.min(docLength, prefix.length),
  to: Math.max(0, docLength - suffix.length),
});

// extension to only allow edits between certain ranges
// https://discuss.codemirror.net/t/migrating-readonly-textmarkers-from-codemirror-5-to-6/7337/5
const readOnlySections = EditorState.transactionFilter.of((tr) => {
  // Get the previous value for the puzzle and the current one, to check for changes
  // I don't like that this check must happen on every transaction, surely there's a
  // better way to detect when a facet's value changes and apply doc transformations
  // there?
  const startPuzzle = tr.startState.facet(puzzleFacet);
  const currentPuzzle = tr.state.facet(puzzleFacet);
  const puzzleChanged = startPuzzle.prefix != currentPuzzle.prefix || startPuzzle.suffix != currentPuzzle.suffix;

  // if the puzzle changed, update the doc
  if (puzzleChanged) {
    const len = tr.startState.doc.length;
    return [
      {
        // keep the effect, since the updated puzzle is in here
        effects: tr.effects,
        // add new changes to replace the prefix and suffix
        changes: [
          {
            from: 0,
            to: Math.min(startPuzzle.prefix.length, len),
            insert: currentPuzzle.prefix,
          },
          {
            from: Math.max(len - startPuzzle.suffix.length, 0),
            to: len,
            insert: currentPuzzle.suffix,
          },
        ],
      },
    ];
  }

  // get the bounds after this transaction would be applied
  const bounds = getBounds(currentPuzzle, tr.newDoc.length);

  // iterate over the changes this transaction applies to check if any of the
  // changes are out of bounds
  let oob = false;
  const trChanges: (Bounds & { inserted: Text })[] = [];
  tr.changes.iterChanges((startFrom, startTo, from, to, inserted) => {
    // check changes would be out of bounds in new document
    oob = oob || from < bounds.from || to > bounds.to + inserted.length;
    // save initial positions of all changes
    trChanges.push({ from: startFrom, to: startTo, inserted });
  });

  // if there were changes that were out of bounds
  if (oob) {
    // get the bounds before this transaction
    const startBounds = getBounds(currentPuzzle, tr.startState.doc.length);

    // clip these changes to within bounds before the transaction, so when
    // it's applied they are still within bounds
    const clip = makeClipper(startBounds);
    const changes = trChanges.map((change) => ({
      from: clip(change.from),
      to: clip(change.to),
      inserted: change.inserted,
    }));
    return [{ changes }];
  }

  // check any selections are out of bounds
  const selectionOob = tr.newSelection.ranges.some((r) => r.from < bounds.from || r.to > bounds.to);
  if (!selectionOob) {
    // allow this transaction, since its changes and selections are within bounds
    return tr;
  }

  // clip the selection within bounds
  const clip = makeClipper(bounds);
  const selection = EditorSelection.create(
    tr.newSelection.ranges.map((r) => EditorSelection.range(clip(r.anchor), clip(r.head))),
    tr.newSelection.mainIndex
  );
  return [{ selection }];
});

const onChangeHandler = EditorView.updateListener.of((update) => {
  if (!update.docChanged) return;
  const { from: fromBound, to: toBound } = getBounds(update.state.facet(puzzleFacet), update.state.doc.length);
  const solution = update.state.doc.sliceString(fromBound, toBound);
  view.dispatch({ effects: updatePuzzle(solution) });
});

const view = new EditorView({ parent: root });
puzzleSelector.dispatchEvent(new Event('change'));
