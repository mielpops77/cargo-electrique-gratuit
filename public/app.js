const PLATFORM_EMOJI = {
  instagram: '📸',
  facebook: '📘',
  youtube: '▶️',
  tiktok: '🎵',
};

const form = document.getElementById('post-form');
const formMessage = document.getElementById('form-message');
const postList = document.getElementById('post-list');
const emptyMessage = document.getElementById('empty-message');

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file');
const dropzonePlaceholder = document.getElementById('dropzone-placeholder');
const previewWrapper = document.getElementById('preview-wrapper');
const previewImage = document.getElementById('preview-image');
const previewVideo = document.getElementById('preview-video');
const removeMediaButton = document.getElementById('remove-media');

const platformToggle = document.getElementById('platform-toggle');
const platformPanels = document.getElementById('platform-panels');

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
    showPreview(fileInput.files[0]);
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) showPreview(fileInput.files[0]);
});

removeMediaButton.addEventListener('click', (event) => {
  event.stopPropagation();
  fileInput.value = '';
  dropzonePlaceholder.hidden = false;
  previewWrapper.hidden = true;
  previewImage.hidden = true;
  previewVideo.hidden = true;
  previewVideo.removeAttribute('src');
});

function showPreview(file) {
  const url = URL.createObjectURL(file);
  dropzonePlaceholder.hidden = true;
  previewWrapper.hidden = false;

  if (file.type.startsWith('video')) {
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

// --- Post list ---

function formatDate(iso) {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

function renderPost(post) {
  const platformBadges = post.platforms.map((platform) => PLATFORM_EMOJI[platform] ?? platform).join(' ');
  const isImage = post.mediaType === 'image';
  const thumb = isImage
    ? `<img class="post-thumb" src="/media/${post.mediaPath}" alt="" />`
    : `<video class="post-thumb" src="/media/${post.mediaPath}" muted></video>`;

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
        <button class="delete-button" data-delete="${post.id}">Supprimer</button>
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
  const posts = await response.json();

  emptyMessage.hidden = posts.length > 0;
  postList.innerHTML = posts.map(renderPost).join('');

  postList.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      await fetch(`/api/posts/${button.dataset.delete}`, { method: 'DELETE' });
      loadPosts();
    });
  });
}

// --- Form submission ---

function collectPlatformContent(selectedPlatforms) {
  const platformContent = {};
  selectedPlatforms.forEach((platform) => {
    const panel = platformPanels.querySelector(`[data-platform="${platform}"]`);
    const text = panel.querySelector('[data-field="text"]').value.trim();
    const hashtags = panel.querySelector('[data-field="hashtags"]').value.trim();
    if (text || hashtags) {
      platformContent[platform] = { text: text || undefined, hashtags: hashtags || undefined };
    }
  });
  return platformContent;
}

function resetForm() {
  form.reset();
  dropzonePlaceholder.hidden = false;
  previewWrapper.hidden = true;
  previewImage.hidden = true;
  previewVideo.hidden = true;
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

  if (!file || platforms.length === 0) {
    formMessage.textContent = 'Choisis un média et au moins une plateforme.';
    return;
  }

  const uploadData = new FormData();
  uploadData.append('file', file);

  const uploadResponse = await fetch('/api/media/upload', { method: 'POST', body: uploadData });
  if (!uploadResponse.ok) {
    formMessage.textContent = "Échec de l'envoi du média.";
    return;
  }
  const { mediaPath, mediaType } = await uploadResponse.json();

  const postResponse = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      baseText,
      platformContent: collectPlatformContent(platforms),
      mediaPath,
      mediaType,
      platforms,
      scheduledAt: new Date(scheduledAt).toISOString(),
    }),
  });

  if (!postResponse.ok) {
    const { error } = await postResponse.json();
    formMessage.textContent = error ?? 'Échec de la programmation du post.';
    return;
  }

  resetForm();
  formMessage.textContent = 'Post programmé ! 🎉';
  loadPosts();
});

loadPosts();
