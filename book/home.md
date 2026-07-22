<style>
  main {
  }
  pre code {
    background: none !important;
    font-family: monospace !important;
    font-weight: 300;
    font-size: 1.5em;
  }
  code a span {
    color: magenta !important;
    text-decoration: underline;
  }

  .modified {
    display: none;
  }
</style>

<script>
  const sidebar = document.getElementById('mdbook-sidebar')
  const sidebarToggle = document.getElementById('mdbook-sidebar-toggle')
  const sidebarCheckbox = document.getElementById('mdbook-sidebar-toggle-anchor')

  document.documentElement.classList.remove('sidebar-visible')
  sidebar.style.display = 'none'
  sidebar.setAttribute('aria-hidden', 'true')
  sidebarToggle.setAttribute('aria-expanded', 'false')
  sidebarCheckbox.checked = false
  document.querySelectorAll('#mdbook-sidebar a').forEach((link) => link.setAttribute('tabindex', '-1'))
</script>

<pre>
<code class="language-json">


{
  "name": "acheronfail",
  "what": "Software Engineer",
  "email": "<a href="mailto:acheronfail@gmail.com">acheronfail@gmail.com</a>",
  "social": {
    "gitlab": "<a href="https://gitlab.com/acheronfail">https://gitlab.com/acheronfail</a>",
    "github": "<a href="https://github.com/acheronfail">https://github.com/acheronfail</a>"
  },
  "links": [
    "<a href="{{latest_post_url}}">my latest post</a>",
    "<a href="about.html">internet stuff</a>",
    "<a href="https://www.acheron.fail/float-view/">Float View</a>",
    "<a href="https://www.acheron.fail/chords/">Chords</a>",
    "<a href="https://codepuzzle.dev/">code puzzles</a>",
  ]
}


</code>
</pre>
