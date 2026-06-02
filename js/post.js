// js/post.js
const API_URL = 'https://kmt285476.onrender.com/api';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    const container = document.getElementById('singlePostContainer');

        // --- Random Logo ပြောင်းသည့် စနစ် ---
    const logoFiles = ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png','7.png', '8.png','9.png', '10.png','11.png', '12.png','13.png']; 
    const randomLogo = logoFiles[Math.floor(Math.random() * logoFiles.length)];
    const logoImg = document.querySelector('.site-logo');
    if (logoImg) {
        logoImg.src = `images/${randomLogo}`;
    }

    // Theme Toggle
    const themeToggleBtn = document.getElementById('themeToggle');
    const moonIcon = document.getElementById('moonIcon');
    const sunIcon = document.getElementById('sunIcon');
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (moonIcon && sunIcon) {
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            let theme = document.documentElement.getAttribute('data-theme');
            if (theme === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                moonIcon.classList.remove('hidden');
                sunIcon.classList.add('hidden');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                moonIcon.classList.add('hidden');
                sunIcon.classList.remove('hidden');
            }
        });
    }

    if (!container) return;
    if (!postId) {
        container.innerHTML = '<p style="text-align: center;">Post not found.</p>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts/${postId}`);
        if (!response.ok) throw new Error('Backend မှ Data ရှာမတွေ့ပါ။');
        const post = await response.json();

        const categoryName = post.category ? post.category.name : 'Uncategorized';
        const postDate = new Date(post.createdAt).toLocaleDateString();

        let html = `
            <div class="single-post-header">
                <span class="single-post-meta">${categoryName} • ${postDate}</span>
                <h1 class="single-post-title">${post.title}</h1>
            </div>
            <div class="single-post-content" style="padding: 0;">${post.content}</div>
        `;

        if (post.fileUrl) {
            html += `<div style="text-align: center; margin-top: 2rem;">
                        <a href="${post.fileUrl}" target="_blank" class="download-btn">Download File / Source</a>
                     </div>`;
        }

        container.innerHTML = html;

    } catch (err) {
        console.error("Fetch error:", err);
        container.innerHTML = `<p style="text-align: center; color: red;">Error loading post: ${err.message}</p>`;
    }
});
