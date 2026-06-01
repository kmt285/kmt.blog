// js/admin.js
const API_URL = 'https://kmt285476.onrender.com/api'; 

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
// ==========================================
    // ၂။ GrapesJS Page Builder Configuration (Photoshop လို Layout ချရန်)
    // ==========================================
    let editorCreate, editorEdit;
    
    try {
        const gjsConfig = (containerId) => ({
            container: `#${containerId}`,
            fromElement: true,
            height: '700px', // Builder ၏ အမြင့်ကို အနည်းငယ် ထပ်ချဲ့နိုင်ပါသည်
            width: '100%',
            storageManager: false, 
            plugins: ['gjs-preset-webpage'], 

            assetManager: {
                // Cloudinary သို့ ပုံတိုက်ရိုက်တင်မည့် စနစ် 
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
                        
                        // Backend မှ Error စာသားများ ပြန်လာပါက ဖမ်းယူနိုင်ရန်
                        const textData = await res.text();
                        let data;
                        try {
                            data = JSON.parse(textData);
                        } catch (parseErr) {
                            alert('Server Error: ' + textData); 
                            return;
                        }
                        
                        if (res.ok && data.url) {
                            // --- ဤနေရာတွင် အတိအကျ ပြင်ဆင်လိုက်ပါသည် ---
                            // this.add အစား မည်သည့် Editor (Post အသစ်လား / Edit လား) ကို သုံးနေသလဲ စစ်ဆေးပြီး ပုံကို ထည့်သွင်းမည်
                            const currentEditor = containerId === 'editor-container' ? editorCreate : editorEdit;
                            currentEditor.AssetManager.add({ src: data.url });
                        } else {
                            alert('Upload Failed: ' + (data.error || 'Unknown error occurred.'));
                        }
                    } catch (err) {
                        alert('Connection Error: ' + err.message); 
                    }
                }
            }
        });

        // Editor နှစ်ခု (Post အသစ်တင်ရန် နှင့် ပြင်ရန်) ကို အသက်သွင်းခြင်း
        editorCreate = grapesjs.init(gjsConfig('editor-container'));
        editorEdit = grapesjs.init(gjsConfig('edit-editor-container'));

    } catch (gjsError) {
        console.error("GrapesJS Initialization Error: ", gjsError);
    }

    // ==========================================
    // လုံခြုံရေးနှင့် Login စနစ် အဆင့်မြှင့်တင်ခြင်း (Auto Logout ပါဝင်သည်)
    // ==========================================
    let inactivityTimer;
    const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 မိနစ်

    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        if (localStorage.getItem('adminToken')) {
            inactivityTimer = setTimeout(performLogout, INACTIVITY_LIMIT);
        }
    }

    ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'].forEach(event => {
        document.addEventListener(event, () => {
            if (localStorage.getItem('adminToken')) resetInactivityTimer();
        });
    });

    function performLogout(isAuto = true) {
        localStorage.removeItem('adminToken');
        clearTimeout(inactivityTimer);
        loginSection.classList.remove('hidden'); 
        dashboardSection.classList.add('hidden');
        document.getElementById('loginForm').reset();
        if (isAuto) alert("လုံခြုံရေးအရ ၁၀ မိနစ်ကြာ အသုံးမပြုသောကြောင့် အလိုအလျောက် Logout လုပ်လိုက်ပါသည်။");
    }

    async function checkAuthStatus() {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            loginSection.classList.remove('hidden');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/auth/verify`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                showDashboard();
            } else {
                performLogout(false);
            }
        } catch (err) {
            console.error("Auth check failed", err);
            performLogout(false);
        }
    }

    checkAuthStatus(); 

    // --- Login Form လုပ်ဆောင်ချက် အသစ် ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorText = document.getElementById('loginError');
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.innerText = 'Logging in...'; 
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        submitBtn.disabled = true; 

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: document.getElementById('username').value, 
                    password: document.getElementById('password').value 
                })
            });
            const data = await res.json();
            
            if (res.ok) { 
                localStorage.setItem('adminToken', data.token); 
                showDashboard(); 
            } else { 
                errorText.innerText = data.message || "Invalid credentials! Please try again."; 
            }
        } catch (err) {
            console.error(err);
        } finally {
            submitBtn.innerText = 'Login';
            submitBtn.disabled = false; 
        }
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
    // Data ဆွဲယူခြင်းနှင့် Manage လုပ်ခြင်း အပိုင်း (မူလအတိုင်း)
    // ==========================================
    async function loadCategories() {
        try {
            const res = await fetch(`${API_URL}/categories`);
            const categories = await res.json();
            
            const createSelect = document.getElementById('postCategory');
            const editSelect = document.getElementById('editPostCategory');
            const catList = document.getElementById('categoryList');

            createSelect.innerHTML = '<option value="" disabled selected>Select</option>';
            editSelect.innerHTML = '<option value="" disabled selected>Select</option>';
            catList.innerHTML = ''; 

            categories.forEach(cat => {
                const opt = `<option value="${cat._id}">${cat.name}</option>`;
                createSelect.innerHTML += opt; 
                editSelect.innerHTML += opt;
                catList.innerHTML += `
                    <li style="display: flex; justify-content: space-between; padding: 0.8rem; border-bottom: 1px solid #f1f3f5; align-items: center;">
                        <span style="font-weight: 500;">${cat.name}</span>
                        <button class="del-cat-btn" data-id="${cat._id}" style="color: red; background: none; border: none; cursor: pointer; font-weight: bold;">Delete</button>
                    </li>
                `;
            });
        } catch (err) { console.error('Failed to load categories', err); }
    }

    document.getElementById('categoryList').addEventListener('click', async (e) => {
        if (e.target.classList.contains('del-cat-btn')) {
            if (confirm('Are you sure you want to delete this category?')) {
                const id = e.target.getAttribute('data-id');
                try {
                    const res = await fetch(`${API_URL}/categories/${id}`, { 
                        method: 'DELETE', 
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } 
                    });
                    if (res.ok) { loadCategories(); loadAdminPosts(); }
                } catch (err) { console.error('Error deleting category', err); }
            }
        }
    });

    async function loadAdminPosts() {
        try {
            const res = await fetch(`${API_URL}/posts?limit=50`);
            const data = await res.json();
            const tbody = document.getElementById('adminPostList');
            tbody.innerHTML = '';
            data.posts.forEach(post => {
                const catName = post.category ? post.category.name : '-';
                tbody.innerHTML += `
                    <tr>
                        <td>${post.title}</td><td>${catName}</td>
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
        
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this post?')) {
                await fetch(`${API_URL}/posts/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } });
                loadAdminPosts();
            }
        }
        
        if (e.target.classList.contains('edit-btn')) {
            try {
                const res = await fetch(`${API_URL}/posts/${id}`);
                const post = await res.json();
                document.getElementById('editPostId').value = post._id;
                document.getElementById('editPostTitle').value = post.title;
                document.getElementById('editPostCategory').value = post.category ? post.category._id : '';
                document.getElementById('editFileUrl').value = post.fileUrl || '';
                
                // GrapesJS ထဲသို့ Data ပြန်ထည့်ခြင်း
                if(editorEdit) {
                    editorEdit.setComponents(post.content); 
                }

                document.getElementById('createPostDiv').classList.add('hidden');
                document.getElementById('editPostDiv').classList.remove('hidden');
                document.getElementById('editPostDiv').scrollIntoView({ behavior: 'smooth' });
            } catch (err) { console.error(err); }
        }
    });

    document.getElementById('cancelEditBtn').addEventListener('click', () => {
        document.getElementById('editPostDiv').classList.add('hidden');
        document.getElementById('createPostDiv').classList.remove('hidden');
    });

    document.getElementById('categoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await fetch(`${API_URL}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }, body: JSON.stringify({ name: document.getElementById('newCategoryName').value }) });
        document.getElementById('catMessage').innerText = 'Added!'; document.getElementById('newCategoryName').value = '';
        loadCategories(); setTimeout(() => document.getElementById('catMessage').innerText = '', 2000);
    });

    document.getElementById('postForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        document.getElementById('postMessage').innerText = 'Publishing...';
        document.getElementById('postMessage').style.color = 'blue';

        // Post အသစ်တင်သည့် Form တွင်
        try {
            // HTML နှင့် CSS ကို ပေါင်း၍ သိမ်းမည်
            const fullContent = editorCreate ? `<style>${editorCreate.getCss()}</style>${editorCreate.getHtml()}` : '';

            const response = await fetch(`${API_URL}/posts`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }, 
                body: JSON.stringify({ 
                    title: document.getElementById('postTitle').value, 
                    category: document.getElementById('postCategory').value, 
                    fileUrl: document.getElementById('fileUrl').value, 
                    content: fullContent // <--- ဤနေရာတွင် ပြင်လိုက်ပါသည်
                }) 
            });
            if (response.ok) { 
                document.getElementById('postMessage').style.color = 'green';
                document.getElementById('postMessage').innerText = 'Published Successfully!'; 
                document.getElementById('postForm').reset(); 
                if(editorCreate) editorCreate.setComponents(''); // Editor ကို ရှင်းလင်းမည်
                loadAdminPosts(); 
                setTimeout(() => document.getElementById('postMessage').innerText = '', 3000);
            } else { 
                const errorData = await response.json();
                document.getElementById('postMessage').style.color = 'red';
                document.getElementById('postMessage').innerText = 'Error: ' + (errorData.error || 'Failed to publish');
            }
        } catch (err) {
            document.getElementById('postMessage').style.color = 'red';
            document.getElementById('postMessage').innerText = 'Network Error. Please try again.';
        }
    });

    document.getElementById('editPostForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editPostId').value;
        document.getElementById('editPostMessage').innerText = 'Updating...';
        document.getElementById('editPostMessage').style.color = 'blue';

        // Edit လုပ်သည့် Form တွင်
        try {
            const editFullContent = editorEdit ? `<style>${editorEdit.getCss()}</style>${editorEdit.getHtml()}` : '';

            const response = await fetch(`${API_URL}/posts/${id}`, { 
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }, 
                body: JSON.stringify({ 
                    title: document.getElementById('editPostTitle').value, 
                    category: document.getElementById('editPostCategory').value, 
                    fileUrl: document.getElementById('editFileUrl').value, 
                    content: editFullContent // <--- ဤနေရာတွင် ပြင်လိုက်ပါသည်
                }) 
            });
            
            if (response.ok) {
                document.getElementById('editPostMessage').style.color = 'green';
                document.getElementById('editPostMessage').innerText = 'Updated Successfully!';
                loadAdminPosts();
                setTimeout(() => { document.getElementById('editPostMessage').innerText = ''; document.getElementById('cancelEditBtn').click(); }, 1500);
            } else {
                const errorData = await response.json();
                document.getElementById('editPostMessage').style.color = 'red';
                document.getElementById('editPostMessage').innerText = 'Error: ' + (errorData.error || 'Failed to update');
            }
        } catch (err) {
            document.getElementById('editPostMessage').style.color = 'red';
            document.getElementById('editPostMessage').innerText = 'Network Error. Please try again.';
        }
    });
});
