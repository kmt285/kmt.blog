// js/post.js
const API_URL = 'https://kmt285476.onrender.com/api';
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    const container = document.getElementById('singlePostContainer');

    if (!postId) {
        container.innerHTML = '<p style="text-align: center;">Post not found.</p>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts/${postId}`);
        if (!response.ok) throw new Error('Post not found');
        const post = await response.json();

        const categoryName = post.category ? post.category.name : 'Uncategorized';
        const postDate = new Date(post.createdAt).toLocaleDateString();

        let html = `
            <div class="single-post-header">
                <span class="single-post-meta">${categoryName} • ${postDate}</span>
                <h1 class="single-post-title">${post.title}</h1>
            </div>
            <div class="single-post-content">${post.content}</div>
        `;

        // ဆော့ဖ်ဝဲလ် Download လင့်ခ် ပါခဲ့လျှင် Button ပြသရန်
        if (post.fileUrl) {
            html += `<div style="text-align: center; margin-top: 2rem;">
                        <a href="${post.fileUrl}" target="_blank" class="download-btn">Download File / Source</a>
                     </div>`;
        }

        container.innerHTML = html;

    } catch (err) {
        console.error(err);
        container.innerHTML = '<p style="text-align: center; color: red;">Error loading post. Please try again.</p>';
    }
});
