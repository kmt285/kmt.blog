// js/admin.js
const API_URL = 'https://kmt285476.onrender.com/api'; 

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // UI Sections
    const editorMainSection = document.getElementById('editorMainSection');
    const managePostsSection = document.getElementById('managePostsSection');
    const showCreateFormBtn = document.getElementById('showCreateFormBtn');
    const cancelEditorBtn = document.getElementById('cancelEditorBtn');
    const mainPostForm = document.getElementById('mainPostForm');

    // ==========================================
    // ၁။ TinyMCE Editor Configuration (The Industry Standard)
    // ==========================================
    tinymce.init({
        selector: '#tinymce-editor',
        height: 600,
        menubar: false,
        plugins: 'advlist autolink lists link image media table code preview fullscreen',
        toolbar: 'undo redo | blocks | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist | link image media table | fullscreen code',
        content_style: "body { font-family: 'Pyidaungsu', 'Padauk', 'Myanmar Text', 'Inter', sans-serif; font-size: 16px; line-height: 1.6; color: #333; } img { max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; }",
        promotion: false, // Upgrade ခလုတ်ဖျောက်ရန်
        images_upload_handler: async (blobInfo, progress) => {
            const formData = new FormData();
            formData.append('image', blobInfo.blob());

            try {
                const res = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                    body: formData
                });
                const data = await res.json();
                if (res.ok && data.url) {
                    return data.url; // Cloudinary လင့်ခ်အမှန်ကို Editor သို့ ပြန်ပို့မည်
                } else {
                    throw new Error(data.error || 'Upload failed');
                }
            } catch (err) {
                throw new Error('Image upload failed');
            }
        }
    });

    // ==========================================
    // ၂။ Create, Edit နှင့် Cancel ခလုတ်များကို ထိန်းချုပ်ခြင်း
    // ==========================================
    showCreateFormBtn.addEventListener('click', () => {
        document.getElementById('editorFormTitle').innerText = 'Publish New Post';
        document.getElementById('savePostBtn').innerText = 'Publish Post';
        mainPostForm.reset(); 
        document.getElementById('currentPostId').value = ''; 
        
        managePostsSection.classList.add('hidden');
        editorMainSection.classList.remove('hidden');
        
        // Editor ထဲတွင် အခွံလွတ်ပြမည်
        if (tinymce.get('tinymce-editor')) {
            tinymce.get('tinymce-editor').setContent('');
        }
    });

    cancelEditorBtn.addEventListener('click', () => {
        editorMainSection.classList.add('hidden');
        managePostsSection.classList.remove('hidden');
    });

    mainPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgBox = document.getElementById('mainPostMessage');
        msgBox.style.color = 'blue';
        msgBox.innerText = 'Saving...';

        const postId = document.getElementById('currentPostId').value;
        const method = postId ? 'PUT' : 'POST'; 
        const url = postId ? `${API_URL}/posts/${postId}` : `${API_URL}/posts`;

        try {
            // TinyMCE မှ Data များကို ဆွဲယူမည်
            const fullContent = tinymce.get('tinymce-editor').getContent();

            const response = await fetch(url, { 
                method: method, 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }, 
                body: JSON.stringify({ 
                    title: document.getElementById('mainPostTitle').value, 
                    category: document.getElementById('mainPostCategory').value, 
                    fileUrl: document.getElementById('mainFileUrl').value, 
                    content: fullContent
                }) 
            });
            
            if (response.ok) { 
                msgBox.style.color = 'green';
                msgBox.innerText = 'Saved Successfully!'; 
                loadAdminPosts(); 
                setTimeout(() => { 
                    msgBox.innerText = ''; 
                    cancelEditorBtn.click(); 
                }, 1500);
            } else { 
                const errorData = await response.json();
                msgBox.style.color = 'red';
                msgBox.innerText = 'Error: ' + (errorData.error || 'Failed to save');
            }
        } catch (err) {
            msgBox.style.color = 'red';
            msgBox.innerText = 'Network Error. Please try again.';
        }
    });

    // ==========================================
    // ၃။ လုံခြုံရေး နှင့် Login စနစ်
    // ==========================================
    let inactivityTimer;
    const INACTIVITY_LIMIT = 10 * 60 * 1000;

    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        if (localStorage.getItem('adminToken')) {
            inactivityTimer = setTimeout(performLogout, INACTIVITY_LIMIT);
        }
    }

    ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'].forEach(evt => {
        document.addEventListener(evt, () => { if (localStorage.getItem('adminToken')) resetInactivityTimer(); });
    });

    function performLogout(isAuto = true) {
        localStorage.removeItem('adminToken');
        clearTimeout(inactivityTimer);
        loginSection.classList.remove('hidden'); 
        dashboardSection.classList.add('hidden');
        loginForm.reset();
        if (isAuto) alert("လုံခြုံရေးအရ ၁၀ မိနစ်ကြာ အသုံးမပြုသောကြောင့် အလိုအလျောက် Logout လုပ်လိုက်ပါသည်။");
    }

    async function checkAuthStatus() {
        const token = localStorage.getItem('adminToken');
        if (!token) { loginSection.classList.remove('hidden'); return; }

        try {
            const res = await fetch(`${API_URL}/auth/verify`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) showDashboard(); else performLogout(false);
        } catch (err) { performLogout(false); }
    }

    checkAuthStatus(); 

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorText = document.getElementById('loginError');
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.innerText = 'Logging in...'; 
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: document.getElementById('username').value, password: document.getElementById('password').value })
            });
            const data = await res.json();
            
            if (res.ok) { localStorage.setItem('adminToken', data.token); showDashboard(); } 
            else { errorText.innerText = data.message || "Invalid credentials! Please try again."; }
        } catch (err) { errorText.innerText = "Network Error! Server might be starting up."; } 
        finally { submitBtn.innerText = 'Login'; submitBtn.disabled = false; submitBtn.style.opacity = '1'; }
    });
    
    logoutBtn.addEventListener('click', () => performLogout(false));

    function showDashboard() {
        loginSection.classList.add('hidden'); 
        dashboardSection.classList.remove('hidden');
        resetInactivityTimer(); 
        loadCategories(); 
        loadAdminPosts();
    }

    // ==========================================
    // ၄။ Data ဆွဲယူခြင်း (Categories & Posts)
    // ==========================================
    async function loadCategories() {
        try {
            const res = await fetch(`${API_URL}/categories`);
            const categories = await res.json();
            const createSelect = document.getElementById('mainPostCategory');
            const catList = document.getElementById('categoryList');

            createSelect.innerHTML = '<option value="" disabled selected>Select</option>';
            catList.innerHTML = ''; 

            categories.forEach(cat => {
                createSelect.innerHTML += `<option value="${cat._id}">${cat.name}</option>`;
                catList.innerHTML += `
                    <li style="display: flex; justify-content: space-between; padding: 0.8rem; border-bottom: 1px solid #f1f3f5; align-items: center;">
                        <span style="font-weight: 500;">${cat.name}</span>
                        <button class="del-cat-btn" data-id="${cat._id}" style="color: red; background: none; border: none; cursor: pointer; font-weight: bold;">Delete</button>
                    </li>
                `;
            });
        } catch (err) { console.error(err); }
    }

    document.getElementById('categoryList').addEventListener('click', async (e) => {
        if (e.target.classList.contains('del-cat-btn') && confirm('Are you sure you want to delete this category?')) {
            await fetch(`${API_URL}/categories/${e.target.getAttribute('data-id')}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } });
            loadCategories(); loadAdminPosts();
        }
    });

    async function loadAdminPosts() {
        try {
            const res = await fetch(`${API_URL}/posts?limit=50`);
            const data = await res.json();
            const tbody = document.getElementById('adminPostList');
            tbody.innerHTML = '';
            data.posts.forEach(post => {
                tbody.innerHTML += `
                    <tr>
                        <td>${post.title}</td><td>${post.category ? post.category.name : '-'}</td>
                        <td style="text-align: right;">
                            <button class="edit-btn" data-id="${post._id}" style="color: blue; cursor: pointer; border: none; background: none; margin-right: 10px;">Edit</button>
                            <button class="delete-btn" data-id="${post._id}" style="color: red; cursor: pointer; border: none; background: none;">Delete</button>
                        </td>
                    </tr>
                `;
            });
        } catch (err) { console.error(err); }
    }

    document.getElementById('adminPostList').addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        
        if (e.target.classList.contains('delete-btn') && confirm('Are you sure you want to delete this post?')) {
            await fetch(`${API_URL}/posts/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } });
            loadAdminPosts();
        }
        
        if (e.target.classList.contains('edit-btn')) {
            try {
                const res = await fetch(`${API_URL}/posts/${id}`);
                const post = await res.json();
                
                document.getElementById('currentPostId').value = post._id;
                document.getElementById('mainPostTitle').value = post.title;
                document.getElementById('mainPostCategory').value = post.category ? post.category._id : '';
                document.getElementById('mainFileUrl').value = post.fileUrl || '';
                
                document.getElementById('editorFormTitle').innerText = 'Edit Post';
                document.getElementById('savePostBtn').innerText = 'Update Post';

                managePostsSection.classList.add('hidden');
                editorMainSection.classList.remove('hidden');

                // Edit Box တွင် Data များ ပြန်ထည့်ပေးခြင်း
                if (tinymce.get('tinymce-editor')) {
                    tinymce.get('tinymce-editor').setContent(post.content);
                }

            } catch (err) { console.error(err); }
        }
    });

    document.getElementById('categoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await fetch(`${API_URL}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }, body: JSON.stringify({ name: document.getElementById('newCategoryName').value }) });
        document.getElementById('catMessage').innerText = 'Added!'; document.getElementById('newCategoryName').value = '';
        loadCategories(); setTimeout(() => document.getElementById('catMessage').innerText = '', 2000);
    });
});
