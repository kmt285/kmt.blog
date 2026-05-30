// js/app.js

const API_URL = 'https://kmt-api.onrender.com/api'; // သင့် Backend URL အမှန်ဖြစ်ပါစေ

document.addEventListener('DOMContentLoaded', () => {
    const postContainer = document.getElementById('postContainer');
    const searchInput = document.getElementById('searchInput');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    let currentPage = 1;
    let totalPages = 1;
    let currentPosts = [];

    // Backend မှ Post များ လှမ်းယူခြင်း
    async function fetchPosts(page = 1, append = false) {
        try {
            const response = await fetch(`${API_URL}/posts?page=${page}&limit=6`);
            const data = await response.json();

            totalPages = data.totalPages;
            
            if (append) {
                currentPosts = [...currentPosts, ...data.posts];
            } else {
                currentPosts = data.posts;
            }

            renderPosts(currentPosts);

            // Load More ခလုတ်ကို လိုအပ်မှသာ ပြရန်
            if (currentPage < totalPages) {
                loadMoreBtn.classList.remove('hidden');
            } else {
                loadMoreBtn.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            postContainer.innerHTML = '<p style="color: red; text-align: center; grid-column: 1 / -1;">Failed to load data. Please try again later.</p>';
        }
    }

    // UI ပေါ်တွင် Post များပြသရန် Function
    function renderPosts(postsToRender) {
        postContainer.innerHTML = ''; 
        
        if (postsToRender.length === 0) {
            postContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; grid-column: 1 / -1;">No posts available yet.</p>';
            return;
        }

        postsToRender.forEach(post => {
            const postCard = document.createElement('div');
            postCard.className = 'post-card';
            
            // Category မရှိပါက 'Uncategorized' ဟု ပြရန်
            const categoryName = post.category ? post.category.name : 'Uncategorized';
            
            // Content ထဲမှ HTML Tag များကို ဖျက်ပြီး စာသားသက်သက် အနည်းငယ်သာ ယူရန်
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = post.content;
            const textContent = tempDiv.textContent || tempDiv.innerText || "";
            const excerpt = textContent.substring(0, 100) + '...';

            postCard.innerHTML = `
                <span class="post-category">${categoryName}</span>
                <h2 class="post-title">${post.title}</h2>
                <p class="post-excerpt">${excerpt}</p>
                <a href="#" class="read-more">Read Full Post</a>
            `;
            
            postContainer.appendChild(postCard);
        });
    }

    // Search လုပ်ဆောင်ချက် (လက်ရှိ ဆွဲယူထားသော Data များထဲမှ ရှာရန်)
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredPosts = currentPosts.filter(post => 
            post.title.toLowerCase().includes(searchTerm) || 
            (post.category && post.category.name.toLowerCase().includes(searchTerm))
        );
        renderPosts(filteredPosts);
    });

    // Load More ခလုတ် နှိပ်သောအခါ
    loadMoreBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchPosts(currentPage, true);
        }
    });

    // စစချင်းတွင် Page 1 ကို ဆွဲယူမည်
    fetchPosts(currentPage);
});
