import { EditorView, basicSetup } from 'codemirror';
import { EditorSelection, EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';

const root: HTMLElement = document.querySelector('#app-rttw')!;
// NOTE: this stops mdbook's keyboard handlers from running when the user is
// using codemirror
root.addEventListener('keydown', (event) => {
  event.stopPropagation();
});
// TODO: better theme
root.style.background = '#fff';

// TODO: a way to dynamically change these?
//  can't be a StateField - no ability to update doc
//  can't be a Facet - this can dynamically change (Compartment) but can't update the doc?
//  how do I do this?
const prefix = 'function foo(';
const suffix = ') {\n  return x;\n}\n';

const clamp = (n: number, from: number, to: number) => Math.min(Math.max(n, from), to);
const state = EditorState.create({
  doc: prefix + suffix,
  extensions: [
    basicSetup,
    javascript(),
    // extension to only allow edits between certain ranges
    // https://discuss.codemirror.net/t/migrating-readonly-textmarkers-from-codemirror-5-to-6/7337/5
    EditorState.transactionFilter.of((tr) => {
      const from = prefix.length;
      const to = Math.max(0, tr.newDoc.length - suffix.length);

      // check any changes are out of bounds
      let oob = false;
      tr.changes.iterChanges(
        (_, __, fromB, toB, inserted) => (oob = oob || fromB < from || toB > to + inserted.length)
      );
      if (oob) return [];

      // check any selections are out of bounds
      const selectionOkay = tr.newSelection.ranges.every((r) => r.from >= from && r.to <= to);
      if (selectionOkay) return tr;

      // create new selection which is in bounds
      const selection = EditorSelection.create(
        tr.newSelection.ranges.map((r) => EditorSelection.range(clamp(r.anchor, from, to), clamp(r.head, from, to))),
        tr.newSelection.mainIndex
      );

      return [{ selection }];
    }),
  ],
});

const view = new EditorView({ state, parent: root, extensions: [] });
view.focus();
