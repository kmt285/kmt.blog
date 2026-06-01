// js/post.js
const API_URL = 'https://kmt285476.onrender.com/api';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    const container = document.getElementById('singlePostContainer');

    // --- Theme (Dark Mode / Light Mode) ခလုတ် လုပ်ဆောင်ချက် (Professional SVG) ---
    const themeToggleBtn = document.getElementById('themeToggle');
    const moonIcon = document.getElementById('moonIcon');
    const sunIcon = document.getElementById('sunIcon');
    const currentTheme = localStorage.getItem('theme');

    // ယခင်က Dark Mode သုံးထားလျှင် Page အားလုံးတွင် အလိုအလျောက် ပြန်ခေါ်ရန်
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

    // Container မရှိပါက JavaScript ရပ်တန့်မည်မဟုတ်ဘဲ Console တွင် ပြမည်
    if (!container) {
        console.error("HTML တွင် singlePostContainer ID ကို ရှာမတွေ့ပါ။");
        return;
    }

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
        const viewsCount = post.views || 0; 

        let html = `
            <div class="single-post-header">
                <span class="single-post-meta">${categoryName} • ${postDate} • 👁️ ${viewsCount} Views</span>
                <h1 class="single-post-title">${post.title}</h1>
            </div>
            <div class="single-post-content ql-editor" style="padding: 0;">${post.content}</div>
        `;

        if (post.fileUrl) {
            html += `<div style="text-align: center; margin-top: 2rem;">
                        <a href="${post.fileUrl}" target="_blank" class="download-btn">Download File / Source</a>
                     </div>`;
        }

        // --- Premium & Elegant Telegram Join Banner ---
        html += `
            <div style="margin-top: 4rem; background: linear-gradient(135deg, #0088cc 0%, #005580 100%); border-radius: 12px; padding: 2.5rem 1.5rem; color: white; display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: 0 10px 20px rgba(0,136,204,0.15);">
                <div style="background: white; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    <svg width="34" height="34" fill="#0088cc" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/></svg>
                </div>
                <h3 style="font-size: 1.4rem; margin-bottom: 0.5rem; font-weight: 700; color: white;">Join Our Telegram Community</h3>
                <p style="font-size: 0.95rem; margin-bottom: 1.8rem; opacity: 0.9; max-width: 450px; color: white; line-height: 1.6;">
                    နောက်ဆုံးရ ဆော့ဖ်ဝဲများနှင့် နည်းပညာ Update များကို အမြန်ဆုံး ရယူနိုင်ရန် ကျွန်ုပ်တို့၏ Telegram Channel သို့ Join ထားလိုက်ပါ။
                </p>
                <a href="https://t.me/s/moviesbydatahouse" target="_blank" style="background-color: white; color: #0088cc; padding: 0.8rem 2.2rem; border-radius: 30px; text-decoration: none; font-weight: 700; font-size: 1rem; display: inline-block; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    Join Now
                </a>
            </div>
        `;

        container.innerHTML = html;

    } catch (err) {
        console.error("Fetch error:", err);
        container.innerHTML = `<p style="text-align: center; color: red;">Error loading post: ${err.message}</p>`;
    }
});
