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

        // --- ဤနေရာမှစ၍ အသစ်ထည့်ပါ (TinyMCE Styles များကို ရှင်းလင်းခြင်း) ---
        const parser = new DOMParser();
        const doc = parser.parseFromString(post.content, 'text/html');

        // ၁။ ပုံများနှင့် Element အားလုံးမှ fixed height/width များကို အတင်းဖြတ်ထုတ်မည်
        doc.querySelectorAll('*').forEach(el => {
            el.style.removeProperty('height');
            el.style.removeProperty('width');
            if (el.tagName === 'IMG' || el.tagName === 'IFRAME' || el.tagName === 'VIDEO') {
                el.removeAttribute('height');
                el.removeAttribute('width');
            }
        });

        // ၂။ Iframe များနှင့် Video များကို 16:9 အတိအကျဖြစ်စေရန် Wrapper ဖြင့် အုပ်ပေးမည်
        doc.querySelectorAll('iframe, video').forEach(media => {
            const wrapper = document.createElement('div');
            wrapper.className = 'responsive-media-wrapper';
            media.parentNode.insertBefore(wrapper, media);
            wrapper.appendChild(media);
        });

        const cleanedContent = doc.body.innerHTML;
        // --- အသစ်ထည့်ခြင်း ပြီးဆုံးပါပြီ ---

        // အောက်ပါ html တွင် post.content အစား cleanedContent ဟု ပြောင်းပေးပါ
        let html = `
            <div class="single-post-header">
                <span class="single-post-meta">${categoryName} • ${postDate}</span>
                <h1 class="single-post-title">${post.title}</h1>
            </div>
            <div class="single-post-content" style="padding: 0;">${cleanedContent}</div>
        `;
        

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

        // ဤနေရာတွင်ရှိသော Telegram Banner အကြီးကြီးကို လုံးဝ ဖျက်ပစ်လိုက်ပါပြီ

        container.innerHTML = html;

    } catch (err) {
        console.error("Fetch error:", err);
        container.innerHTML = `<p style="text-align: center; color: red;">Error loading post: ${err.message}</p>`;
    }
});
