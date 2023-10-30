import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { ViewPlugin, ViewUpdate, Decoration, DecorationSet } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';

const root: HTMLElement = document.querySelector('#app-rttw')!;
// TODO: better theme
root.style.background = '#fff';

const state = EditorState.create({
  doc: '// hello world\nconst meaningOfLife = 42;\n',
  extensions: [basicSetup, javascript()],
});

// TODO: read only sections: https://discuss.codemirror.net/t/migrating-readonly-textmarkers-from-codemirror-5-to-6/7337
const view = new EditorView({ state, parent: root, extensions: [] });

// NOTE: this stops mdbook's keyboard handlers from running when the user is
// using codemirror
root.addEventListener('keydown', (event) => {
  event.stopPropagation();
});

console.log(view);
