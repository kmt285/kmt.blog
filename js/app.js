// js/app.js

const API_URL = 'https://kmt285476.onrender.com/api'; 

document.addEventListener('DOMContentLoaded', () => {
    const postContainer = document.getElementById('postContainer');
    const searchInput = document.getElementById('searchInput');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const categoryNav = document.querySelector('nav ul'); // Menu နေရာကို ဖမ်းယူခြင်း

    let currentPage = 1;
    let totalPages = 1;
    let currentPosts = [];
    let currentCategoryId = ''; // လက်ရှိ ရွေးချယ်ထားသော Category

    // ၁။ Menu တွင် ပြသရန် Category များကို လှမ်းယူခြင်း
    async function fetchCategories() {
        try {
            const res = await fetch(`${API_URL}/categories`);
            const categories = await res.json();
            
            // Menu ခလုတ်များ တည်ဆောက်ခြင်း
            categoryNav.innerHTML = `<li><a href="#" class="active" data-id="">All</a></li>`;
            categories.forEach(cat => {
                categoryNav.innerHTML += `<li><a href="#" data-id="${cat._id}">${cat.name}</a></li>`;
            });

            // ခလုတ်နှိပ်လျှင် အလုပ်လုပ်မည့် စနစ်
            const navLinks = categoryNav.querySelectorAll('a');
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // အရောင်ပြောင်းရန် (Active class)
                    navLinks.forEach(l => l.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    // သက်ဆိုင်ရာ Post များသာ ပြန်ခေါ်ရန်
                    currentCategoryId = e.target.getAttribute('data-id');
                    currentPage = 1; // စာမျက်နှာ ၁ မှ ပြန်စရန်
                    fetchPosts(1, false);
                });
            });
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    }

// ၂။ Backend မှ Post များ လှမ်းယူခြင်း (Loading State ထည့်သွင်းထားသည်)
    async function fetchPosts(page = 1, append = false) {
        try {
            // Data မရောက်လာခင် Loading ပြသရန်
            if (!append) {
                postContainer.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: var(--text-muted); padding: 3rem 0; font-size: 1.1rem;">Loading posts...</p>';
            }
            // Data ဆွဲယူနေစဉ် Load More ခလုတ်ကို ဖျောက်ထားရန်
            loadMoreBtn.classList.add('hidden');

            let url = `${API_URL}/posts?page=${page}&limit=6`;
            if (currentCategoryId) {
                url += `&category=${currentCategoryId}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            totalPages = data.totalPages;
            
            if (append) {
                currentPosts = [...currentPosts, ...data.posts];
            } else {
                currentPosts = data.posts;
            }

            renderPosts(currentPosts);

            // Data အားလုံးပြပြီးမှသာ လိုအပ်ပါက Load More ခလုတ်ကို ပြန်ပြရန်
            if (currentPage < totalPages) {
                loadMoreBtn.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            postContainer.innerHTML = '<p style="color: red; text-align: center; grid-column: 1 / -1; padding: 3rem 0;">Failed to load data. Please try again later.</p>';
        }
    }

    // ၃။ UI ပေါ်တွင် Post များပြသရန် Function
    function renderPosts(postsToRender) {
        postContainer.innerHTML = ''; 
        
        if (postsToRender.length === 0) {
            postContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; grid-column: 1 / -1;">No posts available in this category yet.</p>';
            return;
        }

        postsToRender.forEach(post => {
            const postCard = document.createElement('div');
            postCard.className = 'post-card';
            
            const categoryName = post.category ? post.category.name : 'Uncategorized';
            
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = post.content;
            const textContent = tempDiv.textContent || tempDiv.innerText || "";
            const excerpt = textContent.substring(0, 100) + '...';

            postCard.innerHTML = `
                <span class="post-category">${categoryName}</span>
                <h2 class="post-title">${post.title}</h2>
                <p class="post-excerpt">${excerpt}</p>
                <a href="post.html?id=${post._id}" class="read-more">Read Full Post</a>
            `;
            
            postContainer.appendChild(postCard);
        });
    }

    // Search လုပ်ဆောင်ချက်
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredPosts = currentPosts.filter(post => 
            post.title.toLowerCase().includes(searchTerm) || 
            (post.category && post.category.name.toLowerCase().includes(searchTerm))
        );
        renderPosts(filteredPosts);
    });

    loadMoreBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchPosts(currentPage, true);
        }
    });

    // စစချင်းတွင် Category များနှင့် Post များကို ဆွဲယူမည်
    fetchCategories();
    fetchPosts(currentPage);
});
