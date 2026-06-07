/* ============================================================
   GURMIT LAMBA ART — GALLERY JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  renderGallery();
  renderVideos();
});

function renderGallery() {
  const grid  = document.getElementById('galleryGrid');
  const empty = document.getElementById('galleryEmpty');
  if (!grid) return;

  const products = JSON.parse(localStorage.getItem('gl_products') || '[]')
    .filter(p => p.inGallery && p.images && p.images.length > 0);

  if (products.length === 0) {
    if (empty) empty.style.display = 'flex';
    grid.style.display = 'none';
    return;
  }
  if (empty) empty.style.display = 'none';
  grid.style.display = '';

  grid.innerHTML = '';
  products.forEach(product => {
    product.images.forEach((imgSrc, idx) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.innerHTML = `
        <img src="${imgSrc}" alt="${product.name}" loading="lazy" />
        <div class="gallery-item-overlay">
          <div class="gallery-item-title">${idx === 0 ? product.name : product.name + ' (detail)'}</div>
        </div>`;
      item.addEventListener('click', () => openLightbox(imgSrc, product.name));
      grid.appendChild(item);
    });
  });
}

function renderVideos() {
  const videos = JSON.parse(localStorage.getItem('gl_videos') || '[]');
  const section = document.getElementById('videoSection');
  const grid    = document.getElementById('videoGrid');
  if (!section || !grid) return;

  if (videos.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  grid.innerHTML = '';

  videos.forEach(video => {
    const card = document.createElement('div');
    card.className = 'video-card';

    let mediaHtml = '';
    if (video.fileData) {
      mediaHtml = `<video controls preload="metadata"><source src="${video.fileData}" /></video>`;
    } else if (video.url) {
      // Embed YouTube/Vimeo
      const embedUrl = toEmbedUrl(video.url);
      mediaHtml = `<iframe src="${embedUrl}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
    }

    card.innerHTML = `
      ${mediaHtml}
      <div class="video-card-body">
        <div class="video-card-title">${video.title || 'Process Video'}</div>
        ${video.description ? `<div class="video-card-desc">${video.description}</div>` : ''}
      </div>`;
    grid.appendChild(card);
  });
}

function toEmbedUrl(url) {
  // Convert YouTube watch URL to embed
  if (url.includes('youtube.com/watch')) {
    const v = new URL(url).searchParams.get('v');
    return `https://www.youtube.com/embed/${v}`;
  }
  if (url.includes('youtu.be/')) {
    const v = url.split('youtu.be/')[1].split('?')[0];
    return `https://www.youtube.com/embed/${v}`;
  }
  if (url.includes('vimeo.com/')) {
    const v = url.split('vimeo.com/')[1].split('?')[0];
    return `https://player.vimeo.com/video/${v}`;
  }
  return url; // assume already embed URL
}

// ── LIGHTBOX ─────────────────────────────────────
function openLightbox(src, caption) {
  const lb      = document.getElementById('lightbox');
  const img     = document.getElementById('lightboxImg');
  const capEl   = document.getElementById('lightboxCaption');
  if (!lb || !img) return;
  img.src = src;
  img.alt = caption;
  if (capEl) capEl.textContent = caption;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox')?.classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});