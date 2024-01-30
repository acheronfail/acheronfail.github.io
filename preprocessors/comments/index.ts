#!/usr/bin/env bun

import { runPreprocessor, forEachChapter, declareSupports } from '../common.js';

declareSupports(['html']);

declare const document: any;
declare const MutationObserver: any;

function _getTheme() {
  // mdbook theme -> utterances theme
  const themeMap: Record<string, string> = {
    light: 'github-light',
    rust: 'github-dark-orange',
    coal: 'github-dark',
    navy: 'dark-blue',
    ayu: 'photon-dark',
    latte: 'github-light',
    frappe: 'dark-blue',
    macchiato: 'dark-blue',
    mocha: 'dark-blue',
  };

  for (const cls of document.documentElement.classList) {
    if (themeMap[cls]) {
      return themeMap[cls];
    }
  }

  return 'github-dark';
}

function _watchThemeChanges() {
  const observer = new MutationObserver((mutations: any[]) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        if (document.querySelector('.utterances-frame')) {
          const iframe = document.querySelector('.utterances-frame');
          iframe.contentWindow.postMessage({ type: 'set-theme', theme: _getTheme() }, 'https://utteranc.es');
        }
      }
    });
  });
  observer.observe(document.documentElement, { attributes: true });
}

function _setInitialTheme() {
  const utterancesEl = document.querySelector('#utterances');
  utterancesEl.setAttribute('theme', _getTheme());
}

runPreprocessor(async (_context, book) => {
  await forEachChapter(book, async (chapter) => {
    if (chapter.path === null) return;
    if (!chapter.path.startsWith('posts/')) return;

    chapter.content += `
<script type="text/javascript">window._getTheme = ${_getTheme.toString()};</script>
<script type="text/javascript">window._watchThemeChanges = ${_watchThemeChanges.toString()};</script>
<script id="utterances"
    src="https://utteranc.es/client.js"
    repo="acheronfail/acheronfail.github.io"
    issue-term="pathname"
    label="💬"
    theme="preferred-color-scheme"
    crossorigin="anonymous"
    onload="_watchThemeChanges()"
    async>
</script>
<script type="text/javascript">(${_setInitialTheme.toString()})();</script>
`;
  });
});
