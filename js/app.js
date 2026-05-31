// js/app.js

const API_URL = 'https://kmt285476.onrender.com/api'; 

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const categoryNav = document.getElementById('categoryMenu'); 
    
    // UI Containers များကို ဖမ်းယူခြင်း
    const defaultView = document.getElementById('defaultView');
    const filteredView = document.getElementById('filteredView');
    const slidersContainer = document.getElementById('slidersContainer');
    const filteredGridContainer = document.getElementById('filteredGridContainer');
    const filterTitle = document.getElementById('filterTitle');

    let allPosts = []; 
    let categories = []; 

    // ၁။ စတင်ချိန်တွင် Data အားလုံးကို ဆွဲယူမည်
    async function initApp() {
        try {
            slidersContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Loading Awesome Content...</p>';
            
            const [catRes, postRes] = await Promise.all([
                fetch(`${API_URL}/categories`),
                fetch(`${API_URL}/posts?page=1&limit=200`) 
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

// ၂။ Menu တည်ဆောက်ခြင်း (Category များကိုပါ Random ပြမည်)
    function buildCategoryMenu() {
        categoryNav.innerHTML = `<li><a href="#" class="active" data-id="">All</a></li>`;
        
        // Category များကို ကျပန်း (Shuffle) ဖြစ်စေရန်
        const shuffledMenuCategories = [...categories].sort(() => 0.5 - Math.random());

        shuffledMenuCategories.forEach(cat => {
            categoryNav.innerHTML += `<li><a href="#" data-id="${cat._id}">${cat.name}</a></li>`;
        });

        const navLinks = categoryNav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');
                
                const catId = e.target.getAttribute('data-id');
                const catName = e.target.innerText;
                
                if (!catId) {
                    defaultView.classList.remove('hidden');
                    filteredView.classList.add('hidden');
                    renderDefaultHomeView(); 
                } else {
                    defaultView.classList.add('hidden');
                    filteredView.classList.remove('hidden');
                    filterTitle.innerText = `Category: ${catName}`;
                    
                    const filteredPosts = allPosts.filter(p => p.category && p.category._id === catId);
                    renderGrid(filteredPosts, filteredGridContainer);
                }
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        // --- Desktop တွင် Category Menu ကို Mouse ဖြင့် ဆွဲ၍ရအောင် ထည့်သွင်းခြင်း ---
        let isNavDown = false;
        let navStartX;
        let navScrollLeft;

        categoryNav.addEventListener('mousedown', (e) => {
            isNavDown = true;
            categoryNav.classList.add('active');
            navStartX = e.pageX - categoryNav.offsetLeft;
            navScrollLeft = categoryNav.scrollLeft;
        });

        categoryNav.addEventListener('mouseleave', () => {
            isNavDown = false;
            categoryNav.classList.remove('active');
        });

        categoryNav.addEventListener('mouseup', () => {
            isNavDown = false;
            categoryNav.classList.remove('active');
        });

        categoryNav.addEventListener('mousemove', (e) => {
            if (!isNavDown) return;
            e.preventDefault(); // Text များ Select ဖြစ်ခြင်းကို တားရန်
            const x = e.pageX - categoryNav.offsetLeft;
            const walk = (x - navStartX) * 2; // Scroll အမြန်နှုန်း
            categoryNav.scrollLeft = navScrollLeft - walk;
        });
    }

    // ၃။ Home Page ပြသခြင်း (Slider အကန့်အသတ် နှင့် Slider အတွင်းရှိ Post များ Random စနစ်)
    function renderDefaultHomeView() {
        slidersContainer.innerHTML = ''; 

        // ၃.၁ - Recently Added Slider (ဒါကိုတော့ အသစ်အတိုင်းပဲ အသေထားပါမည်)
        const recentPosts = allPosts.slice(0, 10);
        if (recentPosts.length > 0) {
            slidersContainer.appendChild(createSliderSection('Recently Added', recentPosts));
        }

        // ၃.၂ - Category Sliders ကို Random စနစ်ဖြင့် ၄ ခု သာ ကန့်သတ်ပြသမည်
        const shuffledCategories = [...categories].sort(() => 0.5 - Math.random());
        
        const maxSlidersToShow = 4; 
        let sliderCount = 0;

        for (const cat of shuffledCategories) {
            if (sliderCount >= maxSlidersToShow) break; 

            // ထို Category နှင့် သက်ဆိုင်သော Post များကို ရွေးထုတ်ခြင်း
            let catPosts = allPosts.filter(p => p.category && p.category._id === cat._id);
            
            if (catPosts.length > 0) {
                // *** ဤနေရာတွင် Category အတွင်းရှိ Post များကိုပါ Random (ကျပန်း) ဖြစ်အောင် လုပ်လိုက်ပါသည် ***
                catPosts = catPosts.sort(() => 0.5 - Math.random());

                slidersContainer.appendChild(createSliderSection(cat.name, catPosts));
                sliderCount++;
            }
        }
    }

    // ၄။ Slider တစ်ခုချင်းစီကို ဖန်တီးပေးသော Function (Desktop Drag-to-Scroll ပါဝင်သည်)
    function createSliderSection(title, posts) {
        const section = document.createElement('div');
        section.className = 'slider-section';
        section.innerHTML = `<h3 class="section-title">${title}</h3>`;
        
        const slider = document.createElement('div');
        slider.className = 'slider-container';
        
        posts.forEach(post => {
            slider.innerHTML += buildCardHTML(post, 'slider-card');
        });
        
        let isDown = false;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });
        
        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.classList.remove('active');
        });
        
        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.classList.remove('active');
        });
        
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2;
            slider.scrollLeft = scrollLeft - walk;
        });

        section.appendChild(slider);
        return section;
    }

    // ၅။ Search (သို့) သီးသန့် Category အတွက် Grid ပြသသော Function
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

    // ၆။ Card HTML Helper
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

    // ၇။ Search ရှာဖွေခြင်း
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm === '') {
            defaultView.classList.remove('hidden');
            filteredView.classList.add('hidden');
            return;
        }
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
