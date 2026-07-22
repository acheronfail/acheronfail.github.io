const utterancesTheme = () => {
  const themes = {
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

  for (const theme of document.documentElement.classList) {
    if (themes[theme]) return themes[theme];
  }
  return 'github-dark';
};

const isPost = window.location.pathname.includes('/posts/') && !window.location.pathname.endsWith('/print.html');
const main = document.querySelector('main');
if (isPost && main) {
  const comments = document.createElement('div');
  comments.id = 'comments';
  main.append(comments);

  if (window.location.hostname === 'acheronfail.github.io') {
    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.id = 'utterances';
    script.setAttribute('repo', 'acheronfail/acheronfail.github.io');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('label', '💬');
    script.setAttribute('theme', utterancesTheme());
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', '');
    script.addEventListener('load', () => {
      const observer = new MutationObserver((mutations) => {
        if (mutations.some(({ attributeName, type }) => type === 'attributes' && attributeName === 'class')) {
          document.querySelector('.utterances-frame')?.contentWindow?.postMessage(
            { type: 'set-theme', theme: utterancesTheme() },
            'https://utteranc.es'
          );
        }
      });
      observer.observe(document.documentElement, { attributes: true });
    });
    comments.append(script);
  } else {
    comments.innerHTML = '<p style="margin: 1em;text-align: center">💬</p>';
  }
}
