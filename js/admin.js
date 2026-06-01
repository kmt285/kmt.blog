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
    // ၁။ GrapesJS Page Builder (Single Instance Architecture)
    // ==========================================
    let editor = null; 
    
    function initEditor() {
        if (!editor) {
            editor = grapesjs.init({
                container: '#gjs-container',
                fromElement: true,
                height: '700px', 
                width: '100%',
                storageManager: false, 
                plugins: ['gjs-preset-webpage'], 

                assetManager: {
                    uploadFile: async function(e) {
                        const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
                        if (!files || files.length === 0) return;
                        
                        const formData = new FormData();
                        formData.append('image', files[0]);

                        try {
                            const res = await fetch(`${API_URL}/upload`, {
                                method: 'POST',
                                headers: { 
                                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                                    'Accept': 'application/json'
                                },
                                body: formData
                            });
                            
                            const textData = await res.text();
                            let data;
                            try { data = JSON.parse(textData); } 
                            catch (err) { alert('Server Error: ' + textData); return; }
                            
                            if (res.ok && data.url) {
                                editor.AssetManager.add({ src: data.url }); 
                            } else {
                                alert('Upload Failed: ' + (data.error || 'Unknown error occurred.'));
                            }
                        } catch (err) { alert('Connection Error: ' + err.message); }
                    }
                }
            });
        }
    }

    // ==========================================
    // ၂။ Create, Edit နှင့် Cancel ခလုတ်များကို ထိန်းချုပ်ခြင်း
    // ==========================================
    
    // Create New Post ခလုတ်နှိပ်လျှင်
    showCreateFormBtn.addEventListener('click', () => {
        document.getElementById('editorFormTitle').innerText = 'Publish New Post';
        document.getElementById('savePostBtn').innerText = 'Publish Post';
        mainPostForm.reset(); 
        document.getElementById('currentPostId').value = ''; // ID ဖျက်မည်
        
        managePostsSection.classList.add('hidden');
        editorMainSection.classList.remove('hidden');
        
        initEditor(); // Box ပေါ်လာမှ Editor ကို ခေါ်မည်
        editor.setComponents(''); // Editor အခွံလွတ်ပြမည်
    });

    // Cancel ခလုတ်နှိပ်လျှင်
    cancelEditorBtn.addEventListener('click', () => {
        editorMainSection.classList.add('hidden');
        managePostsSection.classList.remove('hidden');
    });

    // Post Save (Create သို့မဟုတ် Update) လုပ်ခြင်း
    mainPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgBox = document.getElementById('mainPostMessage');
        msgBox.style.color = 'blue';
        msgBox.innerText = 'Saving...';

        const postId = document.getElementById('currentPostId').value;
        const method = postId ? 'PUT' : 'POST'; // ID ရှိလျှင် Update, မရှိလျှင် Create
        const url = postId ? `${API_URL}/posts/${postId}` : `${API_URL}/posts`;

        try {
            const fullContent = editor ? `<style>${editor.getCss()}</style>${editor.getHtml()}` : '';

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
                    cancelEditorBtn.click(); // အောင်မြင်လျှင် Form ကို ပိတ်မည်
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
                
                // Edit Box တွင် Data များ ပြန်ထည့်ပေးခြင်း
                document.getElementById('currentPostId').value = post._id;
                document.getElementById('mainPostTitle').value = post.title;
                document.getElementById('mainPostCategory').value = post.category ? post.category._id : '';
                document.getElementById('mainFileUrl').value = post.fileUrl || '';
                
                document.getElementById('editorFormTitle').innerText = 'Edit Post';
                document.getElementById('savePostBtn').innerText = 'Update Post';

                managePostsSection.classList.add('hidden');
                editorMainSection.classList.remove('hidden');

                initEditor(); // Editor ကို ခေါ်မည်
                setTimeout(() => { if(editor) editor.setComponents(post.content); }, 100);

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
