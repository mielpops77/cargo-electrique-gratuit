const PLATFORM_EMOJI = {
  instagram: '📸',
  facebook: '📘',
  youtube: '▶️',
  tiktok: '🎵',
};

const EDITABLE_STATUSES = ['scheduled', 'failed'];
const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const form = document.getElementById('post-form');
const formTitle = document.getElementById('form-title');
const formMessage = document.getElementById('form-message');
const submitButton = document.getElementById('submit-button');
const cancelEditButton = document.getElementById('cancel-edit');
const postList = document.getElementById('post-list');
const emptyMessage = document.getElementById('empty-message');
const alertBanner = document.getElementById('alert-banner');

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file');
const dropzonePlaceholder = document.getElementById('dropzone-placeholder');
const previewWrapper = document.getElementById('preview-wrapper');
const previewImage = document.getElementById('preview-image');
const previewVideo = document.getElementById('preview-video');
const removeMediaButton = document.getElementById('remove-media');

const platformToggle = document.getElementById('platform-toggle');
const platformPanels = document.getElementById('platform-panels');
const igStoryNote = document.getElementById('ig-story-note');

const calendarView = document.getElementById('calendar-view');
const calendarGrid = document.getElementById('calendar-grid');
const calendarMonthLabel = document.getElementById('calendar-month-label');

// State: when editing an existing post, holds { id, mediaPath, mediaType } until a new file replaces it.
let editingPost = null;
let cachedPosts = [];
let hashtagPresets = [];
let currentView = 'list';
let calendarMonth = new Date();
calendarMonth.setDate(1);

// --- Dropzone / media preview ---

dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('dragover');
  if (event.dataTransfer.files.length > 0) {
    fileInput.files = event.dataTransfer.files;
    showPreview(URL.createObjectURL(fileInput.files[0]), fileInput.files[0].type.startsWith('video'));
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) showPreview(URL.createObjectURL(fileInput.files[0]), fileInput.files[0].type.startsWith('video'));
});

removeMediaButton.addEventListener('click', (event) => {
  event.stopPropagation();
  fileInput.value = '';
  editingPost = null;
  dropzonePlaceholder.hidden = false;
  previewWrapper.hidden = true;
  previewImage.hidden = true;
  previewVideo.hidden = true;
  previewVideo.removeAttribute('src');
});

function showPreview(url, isVideo) {
  dropzonePlaceholder.hidden = true;
  previewWrapper.hidden = false;

  if (isVideo) {
    previewVideo.src = url;
    previewVideo.hidden = false;
    previewImage.hidden = true;
  } else {
    previewImage.src = url;
    previewImage.hidden = false;
    previewVideo.hidden = true;
  }
}

// --- Platform toggle panels ---

platformToggle.addEventListener('change', (event) => {
  const checkbox = event.target;
  if (checkbox.name !== 'platform') return;
  const panel = platformPanels.querySelector(`[data-platform="${checkbox.value}"]`);
  if (panel) panel.hidden = !checkbox.checked;
});

// --- Instagram post type (feed vs story) ---

document.getElementById('ig-post-type-toggle').addEventListener('change', (event) => {
  if (event.target.name !== 'ig-post-type') return;
  const isStory = event.target.value === 'story';
  igStoryNote.hidden = !isStory;
  document.querySelectorAll('[data-ig-text-field]').forEach((field) => {
    field.hidden = isStory;
  });
});

// --- Hashtag presets ---

async function loadHashtagPresets() {
  const response = await fetch('/api/hashtag-presets');
  hashtagPresets = await response.json();
  renderHashtagPresetChips();
}

function renderHashtagPresetChips() {
  document.querySelectorAll('.hashtag-presets').forEach((container) => {
    const platform = container.dataset.presetsPlatform;
    const presets = hashtagPresets.filter((preset) => preset.platform === platform);
    container.innerHTML = presets
      .map(
        (preset) => `
          <span class="hashtag-chip" data-apply-preset-id="${preset.id}">
            ${escapeHtml(preset.hashtags)}
            <button type="button" data-delete-preset="${preset.id}" title="Supprimer ce preset">✕</button>
          </span>
        `,
      )
      .join('');
  });
}

platformPanels.addEventListener('click', async (event) => {
  const deleteButton = event.target.closest('[data-delete-preset]');
  if (deleteButton) {
    await fetch(`/api/hashtag-presets/${deleteButton.dataset.deletePreset}`, { method: 'DELETE' });
    await loadHashtagPresets();
    return;
  }

  const chip = event.target.closest('[data-apply-preset-id]');
  if (chip) {
    const preset = hashtagPresets.find((p) => p.id === Number(chip.dataset.applyPresetId));
    if (preset) {
      chip.closest('.platform-panel').querySelector('[data-field="hashtags"]').value = preset.hashtags;
    }
    return;
  }

  const saveButton = event.target.closest('[data-save-preset]');
  if (saveButton) {
    const platform = saveButton.dataset.savePreset;
    const hashtagsInput = saveButton.closest('.platform-panel').querySelector('[data-field="hashtags"]');
    const hashtags = hashtagsInput.value.trim();
    if (!hashtags) return;
    await fetch('/api/hashtag-presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, hashtags }),
    });
    await loadHashtagPresets();
  }
});

// --- Alert banner (failed posts) ---

function renderAlertBanner() {
  const failedPosts = cachedPosts.filter((post) => post.status === 'failed');
  if (failedPosts.length === 0) {
    alertBanner.hidden = true;
    return;
  }
  const label = failedPosts.length === 1 ? 'post a échoué' : 'posts ont échoué';
  alertBanner.textContent = `⚠️ ${failedPosts.length} ${label} — vérifie les détails ci-dessous.`;
  alertBanner.hidden = false;
}

// --- Post list ---

function formatDate(iso) {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function toDatetimeLocal(iso) {
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function renderPost(post) {
  const platformBadges = post.platforms.map((platform) => PLATFORM_EMOJI[platform] ?? platform).join(' ');
  const isImage = post.mediaType === 'image';
  const thumb = isImage
    ? `<img class="post-thumb" src="/media/${post.mediaPath}" alt="" />`
    : `<video class="post-thumb" src="/media/${post.mediaPath}" muted></video>`;
  const canEdit = EDITABLE_STATUSES.includes(post.status);

  const errorItems = post.status === 'failed'
    ? post.results
        .filter((result) => !result.success)
        .map((result) => `<li>${PLATFORM_EMOJI[result.platform] ?? result.platform} ${escapeHtml(result.error ?? 'Erreur inconnue')}</li>`)
        .join('')
    : '';

  return `
    <li class="post-card">
      ${thumb}
      <div class="post-body">
        <div class="post-meta">
          <span class="status-badge status-${post.status}">${post.status}</span>
          <span>${formatDate(post.scheduledAt)}</span>
          <span class="post-platforms">${platformBadges}</span>
        </div>
        <p class="post-caption">${escapeHtml(post.baseText).slice(0, 140)}</p>
        ${errorItems ? `<ul class="post-errors">${errorItems}</ul>` : ''}
        <div class="post-actions">
          ${canEdit ? `<button class="ghost-button" data-edit="${post.id}">Modifier</button>` : ''}
          <button class="delete-button" data-delete="${post.id}">Supprimer</button>
        </div>
      </div>
    </li>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadPosts() {
  const response = await fetch('/api/posts');
  cachedPosts = await response.json();

  renderAlertBanner();

  emptyMessage.hidden = cachedPosts.length > 0 || currentView !== 'list';
  postList.innerHTML = cachedPosts.map(renderPost).join('');

  postList.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      await fetch(`/api/posts/${button.dataset.delete}`, { method: 'DELETE' });
      if (editingPost?.id === Number(button.dataset.delete)) startEditing(null);
      loadPosts();
    });
  });

  postList.querySelectorAll('[data-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      const post = cachedPosts.find((p) => p.id === Number(button.dataset.edit));
      if (post) startEditing(post);
    });
  });

  if (currentView === 'calendar') renderCalendar();
}

// --- Calendar view ---

document.querySelectorAll('.view-toggle-button').forEach((button) => {
  button.addEventListener('click', () => {
    currentView = button.dataset.view;
    document.querySelectorAll('.view-toggle-button').forEach((b) => b.classList.toggle('active', b === button));
    postList.hidden = currentView !== 'list';
    emptyMessage.hidden = currentView !== 'list' || cachedPosts.length > 0;
    calendarView.hidden = currentView !== 'calendar';
    if (currentView === 'calendar') renderCalendar();
  });
});

document.getElementById('calendar-prev').addEventListener('click', () => {
  calendarMonth.setMonth(calendarMonth.getMonth() - 1);
  renderCalendar();
});
document.getElementById('calendar-next').addEventListener('click', () => {
  calendarMonth.setMonth(calendarMonth.getMonth() + 1);
  renderCalendar();
});

function renderCalendar() {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  calendarMonthLabel.textContent = calendarMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // grille commençant le lundi
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const todayKey = new Date().toDateString();

  let html = DAY_LABELS.map((label) => `<div class="calendar-day-header">${label}</div>`).join('');

  for (let i = 0; i < totalCells; i++) {
    const dayNumber = i - startOffset + 1;
    let cellDate;
    let outside = false;

    if (dayNumber < 1) {
      cellDate = new Date(year, month - 1, daysInPrevMonth + dayNumber);
      outside = true;
    } else if (dayNumber > daysInMonth) {
      cellDate = new Date(year, month + 1, dayNumber - daysInMonth);
      outside = true;
    } else {
      cellDate = new Date(year, month, dayNumber);
    }

    const postsForDay = cachedPosts.filter((post) => new Date(post.scheduledAt).toDateString() === cellDate.toDateString());
    const isToday = cellDate.toDateString() === todayKey;

    const pills = postsForDay
      .map((post) => {
        const time = new Date(post.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const emoji = post.platforms.map((platform) => PLATFORM_EMOJI[platform] ?? '').join('');
        return `<div class="calendar-post-pill" data-calendar-post="${post.id}">${time} ${emoji}</div>`;
      })
      .join('');

    html += `
      <div class="calendar-day ${outside ? 'outside-month' : ''} ${isToday ? 'is-today' : ''}">
        <span class="calendar-day-number">${cellDate.getDate()}</span>
        ${pills}
      </div>
    `;
  }

  calendarGrid.innerHTML = html;
}

calendarGrid.addEventListener('click', (event) => {
  const pill = event.target.closest('[data-calendar-post]');
  if (!pill) return;
  const post = cachedPosts.find((p) => p.id === Number(pill.dataset.calendarPost));
  if (post) startEditing(post);
});

// --- Enter / exit edit mode ---

function startEditing(post) {
  if (!post) {
    editingPost = null;
    resetForm();
    return;
  }

  editingPost = { id: post.id, mediaPath: post.mediaPath, mediaType: post.mediaType };

  formTitle.textContent = `Modifier le post #${post.id}`;
  submitButton.textContent = 'Enregistrer les modifications';
  cancelEditButton.hidden = false;

  document.getElementById('base-text').value = post.baseText;
  document.getElementById('scheduledAt').value = toDatetimeLocal(post.scheduledAt);

  fileInput.value = '';
  showPreview(`/media/${post.mediaPath}`, post.mediaType === 'video');

  form.querySelectorAll('input[name="platform"]').forEach((checkbox) => {
    checkbox.checked = post.platforms.includes(checkbox.value);
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  });

  platformPanels.querySelectorAll('.platform-panel').forEach((panel) => {
    const platform = panel.dataset.platform;
    const content = post.platformContent?.[platform] ?? {};
    panel.querySelector('[data-field="text"]').value = content.text ?? '';
    panel.querySelector('[data-field="hashtags"]').value = content.hashtags ?? '';
    if (platform === 'instagram') {
      const postType = content.postType ?? 'feed';
      panel.querySelector(`input[name="ig-post-type"][value="${postType}"]`).checked = true;
      panel.querySelector(`input[name="ig-post-type"][value="${postType}"]`).dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

cancelEditButton.addEventListener('click', () => startEditing(null));

// --- Form submission ---

function collectPlatformContent(selectedPlatforms) {
  const platformContent = {};
  selectedPlatforms.forEach((platform) => {
    const panel = platformPanels.querySelector(`[data-platform="${platform}"]`);
    const text = panel.querySelector('[data-field="text"]').value.trim();
    const hashtags = panel.querySelector('[data-field="hashtags"]').value.trim();
    const content = { text: text || undefined, hashtags: hashtags || undefined };
    if (platform === 'instagram') {
      content.postType = panel.querySelector('input[name="ig-post-type"]:checked').value;
    }
    if (content.text || content.hashtags || content.postType === 'story') {
      platformContent[platform] = content;
    }
  });
  return platformContent;
}

function resetForm() {
  form.reset();
  formTitle.textContent = 'Nouveau post';
  submitButton.textContent = 'Programmer 🐾';
  cancelEditButton.hidden = true;
  dropzonePlaceholder.hidden = false;
  previewWrapper.hidden = true;
  previewImage.hidden = true;
  previewVideo.hidden = true;
  igStoryNote.hidden = true;
  document.querySelectorAll('[data-ig-text-field]').forEach((field) => {
    field.hidden = false;
  });
  platformPanels.querySelectorAll('.platform-panel').forEach((panel) => {
    panel.hidden = true;
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.textContent = '';

  const file = fileInput.files[0];
  const baseText = document.getElementById('base-text').value;
  const scheduledAt = document.getElementById('scheduledAt').value;
  const platforms = [...form.querySelectorAll('input[name="platform"]:checked')].map((input) => input.value);

  if ((!file && !editingPost) || platforms.length === 0) {
    formMessage.textContent = 'Choisis un média et au moins une plateforme.';
    return;
  }

  let mediaPath = editingPost?.mediaPath;
  let mediaType = editingPost?.mediaType;

  if (file) {
    const uploadData = new FormData();
    uploadData.append('file', file);
    const uploadResponse = await fetch('/api/media/upload', { method: 'POST', body: uploadData });
    if (!uploadResponse.ok) {
      formMessage.textContent = "Échec de l'envoi du média.";
      return;
    }
    ({ mediaPath, mediaType } = await uploadResponse.json());
  }

  const payload = {
    baseText,
    platformContent: collectPlatformContent(platforms),
    mediaPath,
    mediaType,
    platforms,
    scheduledAt: new Date(scheduledAt).toISOString(),
  };

  const url = editingPost ? `/api/posts/${editingPost.id}` : '/api/posts';
  const method = editingPost ? 'PUT' : 'POST';

  const postResponse = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!postResponse.ok) {
    const { error } = await postResponse.json();
    formMessage.textContent = error ?? "Échec de l'enregistrement du post.";
    return;
  }

  const wasEditing = Boolean(editingPost);
  editingPost = null;
  resetForm();
  formMessage.textContent = wasEditing ? 'Post modifié.' : 'Post programmé.';
  loadPosts();
});

loadPosts();
loadHashtagPresets();
