// js/app.js

const API_URL = 'https://kmt285476.onrender.com/api'; 

document.addEventListener('DOMContentLoaded', () => {
    const postContainer = document.getElementById('postContainer');
    const searchInput = document.getElementById('searchInput');
    const categoryNav = document.getElementById('categoryMenu'); 

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

            // Category ခလုတ်နှိပ်လျှင် စစ်ထုတ်မည့် စနစ်
            const navLinks = categoryNav.querySelectorAll('a');
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    navLinks.forEach(l => l.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    currentCategoryId = e.target.getAttribute('data-id');
                    fetchPosts(); // စာမူများကို ပြန်လည်ခေါ်ယူမည်
                });
            });
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    }

    // ၂။ Backend မှ Post များ ဆွဲယူခြင်း (Limit ကို ၅၀ အထိ တိုးမြှင့်ထားသဖြင့် ခလုတ်နှိပ်ရန် မလိုဘဲ အကုန်ပေါ်မည်)
    async function fetchPosts() {
        try {
            postContainer.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: var(--text-muted); padding: 3rem 0; font-size: 1.1rem;">Loading posts...</p>';

            // စာမူပေါင်း ၅၀ အထိ တစ်ခါတည်း ဆွဲယူရန် ပြင်ဆင်လိုက်ပါသည်
            let url = `${API_URL}/posts?page=1&limit=50`;
            if (currentCategoryId) {
                url += `&category=${currentCategoryId}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            currentPosts = data.posts;
            renderPosts(currentPosts);

        } catch (error) {
            console.error('Error fetching posts:', error);
            postContainer.innerHTML = '<p style="color: red; text-align: center; grid-column: 1 / -1; padding: 3rem 0;">Failed to load data. Please try again later.</p>';
        }
    }

    // ၃။ UI ပေါ်တွင် Post များပြသရန် Function
    function renderPosts(postsToRender) {
        postContainer.innerHTML = ''; 
        
        if (postsToRender.length === 0) {
            postContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; grid-column: 1 / -1; padding: 2rem 0;">No posts available in this category yet.</p>';
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

    // စတင်ချိန်တွင် လုပ်ဆောင်မည့် လုပ်ငန်းစဉ်များ
    fetchCategories();
    fetchPosts();
});
