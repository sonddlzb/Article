function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderAbout(site) {
  const whoWeAre = site.about.whoWeAre
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('');

  const team = site.team
    .map(
      (member) => `
        <div class="team-card">
          <strong>${escapeHtml(member.name)}</strong>
          <span>${escapeHtml(member.role)}</span>
        </div>
      `,
    )
    .join('');

  document.getElementById('about-root').innerHTML = `
    <header class="about-hero">
      <h1>About Us</h1>
      <p>${escapeHtml(site.tagline)}</p>
    </header>

    <section class="about-section">
      <h2>Who we are</h2>
      ${whoWeAre}
    </section>

    <section class="about-section">
      <h2>What we cover</h2>
      <p>${escapeHtml(site.about.whatWeCover)}</p>
    </section>

    <section class="about-section">
      <h2>The team</h2>
      <div class="team-grid">${team}</div>
    </section>

    <section class="about-section">
      <h2>Get in touch</h2>
      <p>
        We read every email. For pitches, corrections, or just to say hello — reach us at
        <a href="mailto:${escapeHtml(site.contact.email)}">${escapeHtml(site.contact.email)}</a>.
      </p>
    </section>
  `;
}

function showAboutError(message) {
  document.getElementById('about-root').innerHTML = `
    <div class="article-error">
      <h1>Không tải được trang</h1>
      <p>${escapeHtml(message)}</p>
      <p>Chạy <code>npm run build</code> rồi mở lại trang.</p>
    </div>
  `;
}

function main() {
  const site = window.__ARTICLE_DATA__?.site;
  if (site) {
    if (window.applySiteBranding) window.applySiteBranding(site);
    renderAbout(site);
    return;
  }

  fetch('data/site.json')
    .then((r) => {
      if (!r.ok) throw new Error('Chưa có data — chạy: npm run build');
      return r.json();
    })
    .then((data) => {
      if (window.applySiteBranding) window.applySiteBranding(data);
      renderAbout(data);
    })
    .catch((err) => showAboutError(err.message));
}

main();
