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

// ၁။ စတင်ချိန်တွင် Data အားလုံးကို ဆွဲယူမည်
    async function initApp() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        try {
            // Data များ ဆွဲယူခြင်း
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
            slidersContainer.innerHTML = '<p style="color: red; text-align: center;">Failed to load data. Server might be sleeping. Please refresh.</p>';
        } finally {
            // အောင်မြင်သည်ဖြစ်စေ၊ ကျရှုံးသည်ဖြစ်စေ Loading Overlay ကို ညင်သာစွာ ဖျောက်မည်
            if (loadingOverlay) {
                loadingOverlay.classList.add('fade-out');
            }
        }
    }
// ၂။ Menu တည်ဆောက်ခြင်း (Desktop မြှားခလုတ်စနစ်ဖြင့်)
    function buildCategoryMenu() {
        categoryNav.innerHTML = `<li><a href="#" class="active" data-id="">All</a></li>`;
        
        const shuffledMenuCategories = [...categories].sort(() => 0.5 - Math.random());
        shuffledMenuCategories.forEach(cat => {
            categoryNav.innerHTML += `<li><a href="#" data-id="${cat._id}">${cat.name}</a></li>`;
        });

        // --- Category နှိပ်သည့်အခါ အလုပ်လုပ်မည့်စနစ် ---
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

// --- Desktop မြှားခလုတ် (Left / Right) ဖြင့် ညင်သာစွာ Scroll ရွှေ့ခြင်း ---
        const scrollLeftBtn = document.getElementById('scrollLeftBtn');
        const scrollRightBtn = document.getElementById('scrollRightBtn');

        function toggleScrollButtons() {
            if (!scrollLeftBtn || !scrollRightBtn) return;
            
            if (categoryNav.scrollWidth > categoryNav.clientWidth) {
                scrollLeftBtn.style.display = 'flex';
                scrollRightBtn.style.display = 'flex';
            } else {
                // Scroll ဆွဲစရာ မလိုလျှင် ခလုတ်များကို ဖျောက်ထားမည်
                scrollLeftBtn.style.display = 'none';
                scrollRightBtn.style.display = 'none';
            }
        }

        if (scrollLeftBtn && scrollRightBtn) {
            // Button များ နှိပ်လျှင် အလုပ်လုပ်မည့် စနစ်
            scrollLeftBtn.addEventListener('click', () => {
                categoryNav.scrollBy({ left: -250, behavior: 'smooth' });
            });

            scrollRightBtn.addEventListener('click', () => {
                categoryNav.scrollBy({ left: 250, behavior: 'smooth' });
            });

            // Data များ ဝင်လာပြီး UI နေရာချပြီးချိန်တွင် ခလုတ်ပြ/မပြ စစ်ဆေးရန် (setTimeout ဖြင့် အနည်းငယ် စောင့်ပြီးမှ စစ်ပါသည်)
            setTimeout(toggleScrollButtons, 100); 

            // Window Size အကျယ် ပြောင်းလဲသွားတိုင်း (ဥပမာ Browser ကို ချုံ့/ချဲ့ လုပ်တိုင်း) အလိုအလျောက် ပြန်စစ်ဆေးပေးမည်
            window.addEventListener('resize', toggleScrollButtons);
        }
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

// ၄။ Slider တစ်ခုချင်းစီကို ဖန်တီးပေးသော Function (Desktop Momentum Scroll ပါဝင်သည်)
    function createSliderSection(title, posts) {
        const section = document.createElement('div');
        section.className = 'slider-section';
        section.innerHTML = `<h3 class="section-title">${title}</h3>`;
        
        const slider = document.createElement('div');
        slider.className = 'slider-container';
        
        posts.forEach(post => {
            slider.innerHTML += buildCardHTML(post, 'slider-card');
        });
        
        // --- Desktop အတွက် Momentum Drag-to-Scroll စနစ် ---
        let isDown = false;
        let startX;
        let scrollLeft;
        let velX = 0; // အရှိန် (Velocity) ကို မှတ်သားရန်
        let momentumID; // Animation ကို ထိန်းချုပ်ရန်

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
            
            // အသစ်ပြန်ဆွဲပါက ယခင်အရှိန်ကို ချက်ချင်းရပ်မည်
            cancelAnimationFrame(momentumID); 
        });
        
        slider.addEventListener('mouseleave', () => {
            if (!isDown) return;
            isDown = false;
            slider.classList.remove('active');
            beginMomentumTracking(); // Mouse အပြင်ရောက်သွားလျှင် အရှိန်ဖြင့် ဆက်သွားစေရန်
        });
        
        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.classList.remove('active');
            beginMomentumTracking(); // Mouse လွှတ်လိုက်လျှင် အရှိန်ဖြင့် ဆက်သွားစေရန်
        });
        
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 1.5; 
            
            // လက်ရှိနေရာနှင့် ရွှေ့လိုက်သောနေရာကြားမှ အရှိန် (Velocity) ကို တွက်ချက်ခြင်း
            const prevScrollLeft = slider.scrollLeft;
            slider.scrollLeft = scrollLeft - walk;
            velX = slider.scrollLeft - prevScrollLeft; 
        });

        // --- အရှိန်ဖြင့် လိမ့်သွားစေရန် (Momentum / Inertia) တွက်ချက်သော စနစ် ---
        function beginMomentumTracking() {
            cancelAnimationFrame(momentumID);
            momentumID = requestAnimationFrame(momentumLoop);
        }

        function momentumLoop() {
            // အရှိန်ရှိနေသေးလျှင် ဆက်ရွှေ့မည်
            if (Math.abs(velX) > 0.5) { 
                slider.scrollLeft += velX;
                velX *= 0.92; // 0.92 သည် အရှိန်တဖြည်းဖြည်း လျော့ကျသွားမည့် ပမာဏ (Friction) ဖြစ်သည်
                momentumID = requestAnimationFrame(momentumLoop);
            }
        }

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

        // --- ပုံဆွဲထုတ်သည့် စနစ် (Auto Image Extractor) အသစ် ---
        const imgMatch = post.content.match(/<img[^>]+src=["']([^"']+)["']/);
        // ပုံပါလျှင် ထိုပုံကိုပြမည်၊ မပါလျှင် No Image ပုံကိုပြမည်
        const thumbnailUrl = imgMatch ? imgMatch[1] : 'https://placehold.co/600x400/eeeeee/FF4200?text=No+Image';

        // HTML အသစ် (Thumbnail အကွက် နှင့် Content အကွက် ခွဲခြားထားသည်)
        return `
            <div class="${className}">
                <div class="post-thumbnail" style="background-image: url('${thumbnailUrl}')"></div>
                <div class="post-card-content">
                    <span class="post-category">${categoryName}</span>
                    <h2 class="post-title" style="font-size: 1.1rem; margin-top: 0.5rem;">${post.title}</h2>
                    <p class="post-excerpt" style="font-size: 0.85rem; margin-bottom: 1rem;">${excerpt}</p>
                    <a href="post.html?id=${post._id}" class="read-more">Read Full Post</a>
                </div>
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
