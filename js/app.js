function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso) {
  const date = new Date(iso + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function renderBlock(block) {
  switch (block.type) {
    case 'paragraph':
      return `<p${block.lead ? ' class="lead"' : ''}>${escapeHtml(block.text)}</p>`;
    case 'heading':
      return `<h2 id="${escapeHtml(block.id)}">${escapeHtml(block.text)}</h2>`;
    case 'quote':
      return `<blockquote class="pull-quote">
        <p>&ldquo;${escapeHtml(block.text)}&rdquo;</p>
        ${block.cite ? `<cite>${escapeHtml(block.cite)}</cite>` : ''}
      </blockquote>`;
    case 'closing':
      return `<p class="article-closing">${escapeHtml(block.text)}</p>`;
    default:
      return `<p>${escapeHtml(block.text || '')}</p>`;
  }
}

function renderToc(items) {
  if (!items?.length) return '';
  return items
    .map(
      (item) =>
        `<li><a href="#${escapeHtml(item.id)}">${escapeHtml(item.label)}</a></li>`,
    )
    .join('');
}

function renderTags(tags) {
  if (!tags?.length) return '';
  return tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('');
}

function getData() {
  if (window.__ARTICLE_DATA__) {
    return Promise.resolve(window.__ARTICLE_DATA__);
  }
  return Promise.all([
    fetch('data/article.json').then((r) => {
      if (!r.ok) throw new Error('Could not load data/article.json');
      return r.json();
    }),
    fetch('data/content.json').then((r) => {
      if (!r.ok) throw new Error('Chưa có data/content.json — hãy chạy: npm run build');
      return r.json();
    }),
    fetch('data/site.json').then((r) => {
      if (!r.ok) throw new Error('Could not load data/site.json');
      return r.json();
    }),
  ]).then(([article, content, site]) => ({ article, content, site }));
}

function renderBody(article, content) {
  const pdfPath = article.sourcePdf ? `Source/${article.sourcePdf}` : null;

  if (article.displayMode === 'pdf' && pdfPath) {
    return `
      <div class="pdf-viewer-wrap">
        <p class="pdf-viewer-note">Article source:
          <a href="${escapeHtml(pdfPath)}" target="_blank" rel="noopener">${escapeHtml(article.sourcePdf)}</a>
        </p>
        <iframe class="pdf-viewer" src="${escapeHtml(pdfPath)}" title="${escapeHtml(article.title)} PDF"></iframe>
      </div>
    `;
  }

  return (content.blocks || []).map(renderBlock).join('\n');
}

function renderArticlePage(article, content) {
  const readTime = article.readTimeMinutes
    ? `${article.readTimeMinutes} min read`
    : article.readTime || '';
  const metaLine = [formatDate(article.publishedAt), readTime].filter(Boolean).join(' · ');
  const pdfPath = article.sourcePdf ? `Source/${article.sourcePdf}` : null;
  const heroVisualLabel = article.heroLabel || 'Article cover';
  const bodyHtml = renderBody(article, content);

  document.title = `${article.title} — Plaintext`;
  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) {
    descMeta.setAttribute('content', article.description || article.subtitle || '');
  }

  const pdfLink =
    pdfPath && article.displayMode !== 'pdf'
      ? `<p class="article-source-link"><a href="${escapeHtml(pdfPath)}" target="_blank" rel="noopener">View original PDF</a></p>`
      : '';

  document.getElementById('article-root').innerHTML = `
    <header class="article-hero">
      <div class="article-hero-visual" role="img" aria-label="${escapeHtml(heroVisualLabel)}"></div>
      <div class="article-hero-content">
        <p class="article-category">${escapeHtml(article.category || '')}</p>
        <h1>${escapeHtml(article.title)}</h1>
        <p class="article-subtitle">${escapeHtml(article.subtitle || '')}</p>
        <div class="article-byline">
          <div class="author-avatar" aria-hidden="true">${escapeHtml(article.author.initials)}</div>
          <div class="byline-text">
            <span class="byline-author">${escapeHtml(article.author.name)}</span>
            <span class="article-meta">${escapeHtml(metaLine)}</span>
          </div>
        </div>
        <ul class="article-tags" aria-label="Topics">${renderTags(article.tags)}</ul>
        ${pdfLink}
      </div>
    </header>

    <div class="article-layout">
      <aside class="article-sidebar" aria-label="Table of contents">
        <nav class="toc">
          <p class="toc-label">On this page</p>
          <ol>${renderToc(article.tableOfContents)}</ol>
        </nav>
        <div class="share-box">
          <p class="toc-label">Share</p>
          <button type="button" class="share-btn" id="copy-link-btn" aria-label="Copy article link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            Copy link
          </button>
          <p class="share-feedback" id="copy-feedback" role="status" aria-live="polite"></p>
        </div>
      </aside>

      <div class="article-body" id="article-body">
        ${bodyHtml}
        <aside class="author-card">
          <div class="author-avatar author-avatar--lg" aria-hidden="true">${escapeHtml(article.author.initials)}</div>
          <div>
            <p class="author-card-label">Written by</p>
            <p class="author-card-name">${escapeHtml(article.author.name)}</p>
            <p class="author-card-bio">${escapeHtml(article.author.bio || '')}</p>
          </div>
        </aside>
      </div>
    </div>
  `;
}

function initArticleInteractions() {
  const bar = document.getElementById('read-progress-bar');
  const copyBtn = document.getElementById('copy-link-btn');
  const feedback = document.getElementById('copy-feedback');

  function onScroll() {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const height = doc.scrollHeight - doc.clientHeight;
    const pct = height > 0 ? (scrollTop / height) * 100 : 0;
    if (bar) bar.style.width = `${pct}%`;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  copyBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      if (feedback) {
        feedback.textContent = 'Link copied!';
        setTimeout(() => {
          feedback.textContent = '';
        }, 2000);
      }
    });
  });

  document.querySelectorAll('.toc a').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', link.getAttribute('href'));
    });
  });
}

function showError(message) {
  document.getElementById('article-root').innerHTML = `
    <div class="article-error">
      <h1>Không tải được bài viết</h1>
      <p>${escapeHtml(message)}</p>
      <p>Chạy <code>npm install</code> rồi <code>npm run build</code> trong thư mục dự án.</p>
      <p>Sau đó mở lại <code>index.html</code> hoặc chạy <code>npm start</code>.</p>
    </div>
  `;
}

function main() {
  getData()
    .then(({ article, content, site }) => {
      if (window.applySiteBranding) window.applySiteBranding(site);
      renderArticlePage(article, content);
      initArticleInteractions();
    })
    .catch((err) => {
      showError(err.message || 'Unknown error');
    });
}

main();
