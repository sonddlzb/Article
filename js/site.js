function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applySiteBranding(site) {
  document.querySelectorAll('[data-site-name]').forEach((el) => {
    el.textContent = site.name;
  });

  const copyright = document.querySelector('[data-copyright]');
  if (copyright) {
    copyright.textContent = `© ${site.copyrightYear} ${site.name}. All rights reserved.`;
  }

  const footerContact = document.querySelector('[data-footer-contact]');
  if (footerContact && site.contact) {
    footerContact.innerHTML = `
      <a href="${escapeHtml(site.contact.phoneHref)}">${escapeHtml(site.contact.phone)}</a>
      <a href="mailto:${escapeHtml(site.contact.email)}">${escapeHtml(site.contact.email)}</a>
      <span>${escapeHtml(site.contact.address)}</span>
    `;
  }
}

window.applySiteBranding = applySiteBranding;

function initSite() {
  if (window.__ARTICLE_DATA__?.site) {
    applySiteBranding(window.__ARTICLE_DATA__.site);
    return;
  }
  fetch('data/site.json')
    .then((r) => {
      if (!r.ok) throw new Error('site.json');
      return r.json();
    })
    .then(applySiteBranding)
    .catch(() => {});
}

initSite();
