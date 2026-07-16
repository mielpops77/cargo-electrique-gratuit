const form = document.getElementById('post-form');
const formMessage = document.getElementById('form-message');
const postList = document.getElementById('post-list');

async function loadPosts() {
  const response = await fetch('/api/posts');
  const posts = await response.json();

  postList.innerHTML = posts
    .map(
      (post) => `
        <li>
          <strong>${new Date(post.scheduledAt).toLocaleString('fr-FR')}</strong>
          — <span class="status-${post.status}">${post.status}</span>
          — ${post.platforms.join(', ')}
          <br />
          ${post.caption.slice(0, 80)}
          <br />
          <button data-delete="${post.id}">Supprimer</button>
        </li>
      `,
    )
    .join('');

  postList.querySelectorAll('[data-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      await fetch(`/api/posts/${button.dataset.delete}`, { method: 'DELETE' });
      loadPosts();
    });
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.textContent = '';

  const file = document.getElementById('file').files[0];
  const caption = document.getElementById('caption').value;
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
      caption,
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

  form.reset();
  formMessage.textContent = 'Post programmé !';
  loadPosts();
});

loadPosts();
