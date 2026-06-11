// js/app.js

const API_URL = 'https://kmt285476.onrender.com/api'; 

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const categoryNav = document.getElementById('categoryMenu'); 

    // --- Random Logo ပြောင်းသည့် စနစ် ---
    const logoFiles = ['1 (1).png', '1 (2).png', '1 (3).png', '1 (4).png', '1 (5).png', '1 (6).png','1 (7).png', '1 (8).png','1 (9).png', '1 (10).png','1 (11).png', '1 (12).png','1 (13).png', '1 (14).png','1 (15).png', '1 (16).png','1 (17).png', '1 (18).png','1 (19).png', '1 (20).png'];
    const randomLogo = logoFiles[Math.floor(Math.random() * logoFiles.length)];
    const logoImg = document.querySelector('.site-logo');
    if (logoImg) {
        logoImg.src = `images/${randomLogo}`;
    }

    
    // UI Containers များကို ဖမ်းယူခြင်း
    const defaultView = document.getElementById('defaultView');
    const filteredView = document.getElementById('filteredView');
    const slidersContainer = document.getElementById('slidersContainer');
    const filteredGridContainer = document.getElementById('filteredGridContainer');
    const filterTitle = document.getElementById('filterTitle');

    let allPosts = []; 
    let categories = []; 

    // --- Theme (Dark Mode / Light Mode) ခလုတ် လုပ်ဆောင်ချက် ---
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

    // ၁။ စတင်ချိန်တွင် Data အားလုံးကို ဆွဲယူမည်
    async function initApp() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        try {
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
                    filterTitle.innerText = catName ;
                    
                    const filteredPosts = allPosts.filter(p => p.category && p.category._id === catId);
                    renderGrid(filteredPosts, filteredGridContainer);
                }
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        const scrollLeftBtn = document.getElementById('scrollLeftBtn');
        const scrollRightBtn = document.getElementById('scrollRightBtn');

        function toggleScrollButtons() {
            if (!scrollLeftBtn || !scrollRightBtn) return;
            
            if (categoryNav.scrollWidth > categoryNav.clientWidth) {
                scrollLeftBtn.style.display = 'flex';
                scrollRightBtn.style.display = 'flex';
            } else {
                scrollLeftBtn.style.display = 'none';
                scrollRightBtn.style.display = 'none';
            }
        }

        if (scrollLeftBtn && scrollRightBtn) {
            scrollLeftBtn.addEventListener('click', () => {
                categoryNav.scrollBy({ left: -250, behavior: 'smooth' });
            });

            scrollRightBtn.addEventListener('click', () => {
                categoryNav.scrollBy({ left: 250, behavior: 'smooth' });
            });

            setTimeout(toggleScrollButtons, 100); 
            window.addEventListener('resize', toggleScrollButtons);
        }
    }
    
    // ၃။ Home Page ပြသခြင်း
    function renderDefaultHomeView() {
        slidersContainer.innerHTML = ''; 

        const recentPosts = allPosts.slice(0, 10);
        if (recentPosts.length > 0) {
            slidersContainer.appendChild(createSliderSection('Recently Added', recentPosts));
        }

        const shuffledCategories = [...categories].sort(() => 0.5 - Math.random());
        const maxSlidersToShow = 4; 
        let sliderCount = 0;

        for (const cat of shuffledCategories) {
            if (sliderCount >= maxSlidersToShow) break; 

            let catPosts = allPosts.filter(p => p.category && p.category._id === cat._id);
            
            if (catPosts.length > 0) {
                catPosts = catPosts.sort(() => 0.5 - Math.random());
                slidersContainer.appendChild(createSliderSection(cat.name, catPosts));
                sliderCount++;
            }
        }
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
        
        let isDown = false;
        let startX;
        let scrollLeft;
        let velX = 0; 
        let momentumID; 

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
            cancelAnimationFrame(momentumID); 
        });
        
        slider.addEventListener('mouseleave', () => {
            if (!isDown) return;
            isDown = false;
            slider.classList.remove('active');
            beginMomentumTracking(); 
        });
        
        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.classList.remove('active');
            beginMomentumTracking(); 
        });
        
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 1.5; 
            
            const prevScrollLeft = slider.scrollLeft;
            slider.scrollLeft = scrollLeft - walk;
            velX = slider.scrollLeft - prevScrollLeft; 
        });

        function beginMomentumTracking() {
            cancelAnimationFrame(momentumID);
            momentumID = requestAnimationFrame(momentumLoop);
        }

        function momentumLoop() {
            if (Math.abs(velX) > 0.5) { 
                slider.scrollLeft += velX;
                velX *= 0.92; 
                momentumID = requestAnimationFrame(momentumLoop);
            }
        }

        section.appendChild(slider);
        return section;
    }

    // ၅။ Search (သို့) သီးသန့် Category အတွက် Grid
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

    // ၆။ Card HTML Helper (Views ဖယ်ရှားထားပြီးပါပြီ)
    function buildCardHTML(post, className) {
        const categoryName = post.category ? post.category.name : 'Uncategorized';

        // ပုံဆွဲထုတ်သည့် စနစ်
        const imgMatch = post.content.match(/<img[^>]+src=["']([^"']+)["']/);
        const thumbnailUrl = imgMatch ? imgMatch[1] : 'https://placehold.co/600x400/eeeeee/FF4200?text=No+Image';

        return `
            <div class="${className}">
                <div class="post-thumbnail" style="background-image: url('${thumbnailUrl}')"></div>
                <div class="post-card-content">
                    <span class="post-category">${categoryName}</span>
                    <h2 class="post-title" style="font-size: 1.1rem; margin-top: 0.5rem; margin-bottom: 1.5rem;">${post.title}</h2>
                    
                    <div style="margin-top: auto;">
                        <a href="post.html?id=${post._id}" class="read-more" style="margin-top: 0;">Read Full Post</a>
                    </div>
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

    initApp();
});
