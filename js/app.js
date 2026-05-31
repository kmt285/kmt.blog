// js/app.js

const API_URL = 'https://kmt285476.onrender.com/api'; 

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const categoryNav = document.getElementById('categoryMenu'); 
    
    // UI Containers များကို ဖမ်းယူခြင်း
    const defaultView = document.getElementById('defaultView');
    const filteredView = document.getElementById('filteredView');
    const slidersContainer = document.getElementById('slidersContainer');
    const randomGridContainer = document.getElementById('randomGridContainer');
    const filteredGridContainer = document.getElementById('filteredGridContainer');
    const filterTitle = document.getElementById('filterTitle');

    let allPosts = []; // Post အားလုံး သိမ်းရန်
    let categories = []; // Category အားလုံး သိမ်းရန်

    // ၁။ စတင်ချိန်တွင် Data အားလုံးကို တစ်ပြိုင်နက် ဆွဲယူမည်
    async function initApp() {
        try {
            slidersContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Loading Awesome Content...</p>';
            
            // Category နှင့် Post များကို ပြိုင်တူဆွဲယူခြင်း (ပိုမြန်စေရန်)
            const [catRes, postRes] = await Promise.all([
                fetch(`${API_URL}/categories`),
                fetch(`${API_URL}/posts?page=1&limit=100`) // Post ၁၀၀ အထိ ဆွဲယူမည်
            ]);

            categories = await catRes.json();
            const postData = await postRes.json();
            allPosts = postData.posts;

            buildCategoryMenu();
            renderDefaultHomeView();

        } catch (error) {
            console.error('Error initializing app:', error);
            slidersContainer.innerHTML = '<p style="color: red; text-align: center;">Failed to load data. Please try again later.</p>';
        }
    }

    // ၂။ Menu တည်ဆောက်ခြင်း နှင့် Click နှိပ်လျှင် Filter လုပ်ခြင်း
    function buildCategoryMenu() {
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
                
                const catId = e.target.getAttribute('data-id');
                const catName = e.target.innerText;
                
                if (!catId) {
                    // "All" ကို နှိပ်လျှင် ပုံမှန် Slider အတိုင်း ပြန်ပြမည်
                    defaultView.classList.remove('hidden');
                    filteredView.classList.add('hidden');
                } else {
                    // Category တစ်ခုကို နှိပ်လျှင် Slider များ ဖျောက်ပြီး ထို Category များကိုသာ ပြမည်
                    defaultView.classList.add('hidden');
                    filteredView.classList.remove('hidden');
                    filterTitle.innerText = `Category: ${catName}`;
                    
                    const filteredPosts = allPosts.filter(p => p.category && p.category._id === catId);
                    renderGrid(filteredPosts, filteredGridContainer);
                }

                // ရှာဖွေမှုရလဒ်များကို ချက်ချင်းမြင်ရစေရန် စာမျက်နှာကို အပေါ်ဆုံးသို့ ညင်သာစွာ ပြန်တင်ပေးမည်
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    // ၃။ ပုံမှန် Home Page (Slider + Random Grid) တည်ဆောက်ခြင်း
    function renderDefaultHomeView() {
        slidersContainer.innerHTML = ''; 

        // ၃.၁ - Recently Added Slider (နောက်ဆုံးတင်သော ၁၀ ခု)
        const recentPosts = allPosts.slice(0, 10);
        if (recentPosts.length > 0) {
            slidersContainer.appendChild(createSliderSection('Recently Added', recentPosts));
        }

        // ၃.၂ - Category အလိုက် Slider များ တည်ဆောက်ခြင်း
        categories.forEach(cat => {
            const catPosts = allPosts.filter(p => p.category && p.category._id === cat._id);
            if (catPosts.length > 0) {
                // Category တစ်ခုစီတိုင်းအတွက် Slider တစ်ခုစီ ပြမည်
                slidersContainer.appendChild(createSliderSection(cat.name, catPosts));
            }
        });

        // ၃.၃ - Random Picks Grid (အောက်ဆုံးတွင် ကျပန်း ၁၂ ခု ပြမည်)
        const shuffledPosts = [...allPosts].sort(() => 0.5 - Math.random());
        const randomPicks = shuffledPosts.slice(0, 12);
        renderGrid(randomPicks, randomGridContainer);
    }

    // ၄။ Slider တစ်ခုချင်းစီကို ဖန်တီးပေးသော Function
    function createSliderSection(title, posts) {
        const section = document.createElement('div');
        section.className = 'slider-section';
        section.innerHTML = `<h3 class="section-title">${title}</h3>`;
        
        const slider = document.createElement('div');
        slider.className = 'slider-container';
        
        posts.forEach(post => {
            slider.innerHTML += buildCardHTML(post, 'slider-card');
        });
        
        section.appendChild(slider);
        return section;
    }

    // ၅။ Grid (အကွက်များ) ဖြင့် ပြသသော Function
    function renderGrid(posts, container) {
        container.innerHTML = '';
        if (posts.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1 / -1;">No posts found.</p>';
            return;
        }
        posts.forEach(post => {
            container.innerHTML += buildCardHTML(post, 'post-card');
        });
    }

    // ၆။ Card HTML ပုံစံထုတ်ပေးသော Helper Function (Slider ကော Grid ကော ဤဒီဇိုင်းကို သုံးမည်)
    function buildCardHTML(post, className) {
        const categoryName = post.category ? post.category.name : 'Uncategorized';
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = post.content;
        const textContent = tempDiv.textContent || tempDiv.innerText || "";
        const excerpt = textContent.substring(0, 80) + '...';

        return `
            <div class="${className}">
                <div>
                    <span class="post-category">${categoryName}</span>
                    <h2 class="post-title" style="font-size: 1.1rem;">${post.title}</h2>
                    <p class="post-excerpt" style="font-size: 0.85rem; margin-bottom: 1rem;">${excerpt}</p>
                </div>
                <a href="post.html?id=${post._id}" class="read-more">Read Full Post</a>
            </div>
        `;
    }

    // ၇။ Search ရှာဖွေခြင်း လုပ်ဆောင်ချက်
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm === '') {
            // စာဖျက်လိုက်လျှင် ပုံမှန် Slider သို့ ပြန်သွားမည်
            defaultView.classList.remove('hidden');
            filteredView.classList.add('hidden');
            return;
        }

        // စာရိုက်ရှာလျှင် Slider များဖျောက်ပြီး ရှာတွေ့သမျှကို Grid ဖြင့်ပြမည်
        defaultView.classList.add('hidden');
        filteredView.classList.remove('hidden');
        filterTitle.innerText = `Search Results for "${e.target.value}"`;

        const filtered = allPosts.filter(post => 
            post.title.toLowerCase().includes(searchTerm) || 
            (post.category && post.category.name.toLowerCase().includes(searchTerm))
        );
        renderGrid(filtered, filteredGridContainer);
    });

    // အားလုံး အသင့်ဖြစ်လျှင် စတင်ခေါ်ယူမည်
    initApp();
});
