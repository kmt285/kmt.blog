// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    
    // Sample Data - နောက်ပိုင်းတွင် ဤနေရာ၌ Backend API မှ Data များကို Fetch လုပ်ပါမည်။
    const posts = [
        {
            id: 1,
            category: 'Technology',
            title: 'Building Scalable Web Applications',
            excerpt: 'Understanding the core principles of creating robust backend systems and managing data effectively.',
            link: '#'
        },
        {
            id: 2,
            category: 'Software',
            title: 'Custom POS System Update v2.1',
            excerpt: 'Download the latest lightweight point-of-sale software executable file for small businesses.',
            link: '#'
        },
        {
            id: 3,
            category: 'Poems',
            title: 'The Silent Code',
            excerpt: 'A short reflection on the quiet hours of debugging and building logical structures.',
            link: '#'
        },
        {
            id: 4,
            category: 'Design',
            title: 'Minimalism in UI Design',
            excerpt: 'Why less is often more when designing user interfaces for modern web applications.',
            link: '#'
        }
    ];

    const postContainer = document.getElementById('postContainer');
    const searchInput = document.getElementById('searchInput');

    // UI ပေါ်တွင် Post များပြသရန် Function
    function renderPosts(data) {
        postContainer.innerHTML = ''; // Clear current posts
        
        if (data.length === 0) {
            postContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; grid-column: 1 / -1;">No results found.</p>';
            return;
        }

        data.forEach(post => {
            const postCard = document.createElement('div');
            postCard.className = 'post-card';
            
            postCard.innerHTML = `
                <span class="post-category">${post.category}</span>
                <h2 class="post-title">${post.title}</h2>
                <p class="post-excerpt">${post.excerpt}</p>
                <a href="${post.link}" class="read-more">Read Full Post</a>
            `;
            
            postContainer.appendChild(postCard);
        });
    }

    // Search လုပ်ဆောင်ချက်
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredPosts = posts.filter(post => 
            post.title.toLowerCase().includes(searchTerm) || 
            post.category.toLowerCase().includes(searchTerm) ||
            post.excerpt.toLowerCase().includes(searchTerm)
        );
        renderPosts(filteredPosts);
    });

    // စစချင်းတွင် Post အားလုံးကို ပြသထားမည်
    renderPosts(posts);
});
