import { EditorView, basicSetup } from 'codemirror';
import { Compartment, EditorSelection, EditorState, Facet } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { season1 } from './puzzles';

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
  view.dispatch({ effects: updatePuzzleEffect() });
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

function updatePuzzleEffect(solution?: string) {
  const puzzle = season1.find((p) => p.name === puzzleSelector.value);
  if (!puzzle) {
    throw new Error(`Failed to find puzzle, select value: ${puzzleSelector.value}`);
  }

  const prefix = `// This is your function...\n${puzzle.source}\n\n// ... now make it return \`true\`!\n${puzzle.name}(`;
  const result = solution ? runInBrowser(prefix + solution + ');') : undefined;
  const resultText = result === true ? `${result} 🎉` : result ?? '<no input>';

  return puzzleCompartment.reconfigure(
    puzzleFacet.of({
      prefix,
      suffix: `);\n\n// Result: ${resultText}\n// Length: ${solution?.length ?? 0}`,
    })
  );
}

function getBounds({ prefix, suffix }: PuzzleFacet, docLength: number) {
  return {
    from: prefix.length,
    to: Math.max(0, docLength - suffix.length),
  };
}

const state = EditorState.create({
  extensions: [
    basicSetup,
    javascript(),
    puzzleCompartment.of(puzzleFacet.of(defaultPuzzle())),
    // extension to only allow edits between certain ranges
    // https://discuss.codemirror.net/t/migrating-readonly-textmarkers-from-codemirror-5-to-6/7337/5
    EditorState.transactionFilter.of((tr) => {
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

      const { from: fromBound, to: toBound } = getBounds(currentPuzzle, tr.newDoc.length);

      // check any changes are out of bounds
      let oob = false;
      tr.changes.iterChanges(
        (_, __, fromB, toB, inserted) => (oob = oob || fromB < fromBound || toB > toBound + inserted.length)
      );
      if (oob) {
        // cancel transaction, since it was changing something out of bounds
        return [];
      }

      // check any selections are out of bounds
      const selectionOob = tr.newSelection.ranges.some((r) => r.from < fromBound || r.to > toBound);
      if (!selectionOob) {
        // allow this transaction, since its changes and selections are within bounds
        return tr;
      }

      // clip the selection within bounds
      const clipToBounds = (n: number) => Math.min(Math.max(n, fromBound), toBound);
      const selection = EditorSelection.create(
        tr.newSelection.ranges.map((r) => EditorSelection.range(clipToBounds(r.anchor), clipToBounds(r.head))),
        tr.newSelection.mainIndex
      );
      return [{ selection }];
    }),
    EditorView.updateListener.of((update) => {
      if (!update.docChanged) return;
      const { from: fromBound, to: toBound } = getBounds(update.state.facet(puzzleFacet), update.state.doc.length);
      const solution = update.state.doc.sliceString(fromBound, toBound);
      view.dispatch({ effects: updatePuzzleEffect(solution) });
    }),
  ],
});

const view = new EditorView({ state, parent: root });
view.dispatch({ effects: updatePuzzleEffect() });
view.focus();
