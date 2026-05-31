// js/admin.js
const API_URL = 'https://kmt285476.onrender.com/api'; 

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // --- ၁။ Editor Configuration ---
    const quillConfig = { 
        theme: 'snow', 
        placeholder: 'စာမူများကို ဤနေရာတွင် ရိုက်နှိပ်ပါ...',
        modules: { 
            toolbar: [ 
                [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                ['link', 'image', 'video'],
                ['clean']
            ],
            imageResize: {
                displayStyles: { backgroundColor: 'black', border: 'none', color: 'white' },
                modules: [ 'Resize', 'DisplaySize', 'Toolbar' ]
            }
        } 
    };

    const quill = new Quill('#editor-container', quillConfig);
    const editQuill = new Quill('#edit-editor-container', quillConfig);

    // --- ၂။ လုံးဝ အမှားမခံသော Image Upload Function ---
    function selectLocalImage(editorInstance) {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('image', file);

            let range = editorInstance.getSelection(true);
            if (!range) range = { index: editorInstance.getLength() };

            editorInstance.insertText(range.index, 'Uploading image...', 'user');

            try {
                const res = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                    body: formData
                });
                const data = await res.json();
                
                editorInstance.deleteText(range.index, 18); 

                if (res.ok && data.url) {
                    editorInstance.insertEmbed(range.index, 'image', data.url);
                } else {
                    alert('Upload Failed: ' + (data.error || 'Unknown error occurred.'));
                }
            } catch (err) {
                editorInstance.deleteText(range.index, 18);
                alert('Network Error while uploading.');
            }
        };
    }

    // --- ၃။ Toolbar ချိတ်ဆက်ခြင်း ---
    quill.getModule('toolbar').addHandler('image', () => selectLocalImage(quill));
    editQuill.getModule('toolbar').addHandler('image', () => selectLocalImage(editQuill));

    // --- ၄။ Copy/Paste နှင့် Drag & Drop အလိုအလျောက် တင်ပေးမည့် စနစ် ---
    async function uploadDroppedOrPastedImage(file, editorInstance) {
        const formData = new FormData();
        formData.append('image', file);

        let range = editorInstance.getSelection(true);
        if (!range) range = { index: editorInstance.getLength() };

        editorInstance.insertText(range.index, 'Uploading image...', 'user');

        try {
            const res = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                body: formData
            });
            const data = await res.json();
            
            editorInstance.deleteText(range.index, 18); 

            if (res.ok && data.url) {
                editorInstance.insertEmbed(range.index, 'image', data.url);
            } else {
                alert('Upload Failed: ' + (data.error || 'Unknown error occurred.'));
            }
        } catch (err) {
            editorInstance.deleteText(range.index, 18);
            alert('Network Error while uploading.');
        }
    }

    function handlePasteAndDrop(editorInstance) {
        editorInstance.root.addEventListener('paste', async (e) => {
            if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length) {
                const file = e.clipboardData.files[0];
                if (file.type.startsWith('image/')) {
                    e.preventDefault(); 
                    await uploadDroppedOrPastedImage(file, editorInstance);
                }
            }
        });
        editorInstance.root.addEventListener('drop', async (e) => {
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
                const file = e.dataTransfer.files[0];
                if (file.type.startsWith('image/')) {
                    e.preventDefault(); 
                    await uploadDroppedOrPastedImage(file, editorInstance);
                }
            }
        });
    }

    handlePasteAndDrop(quill);
    handlePasteAndDrop(editQuill);

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
                editQuill.root.innerHTML = post.content;

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

        try {
            const response = await fetch(`${API_URL}/posts`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }, 
                body: JSON.stringify({ title: document.getElementById('postTitle').value, category: document.getElementById('postCategory').value, fileUrl: document.getElementById('fileUrl').value, content: quill.root.innerHTML }) 
            });

            if (response.ok) { 
                document.getElementById('postMessage').style.color = 'green';
                document.getElementById('postMessage').innerText = 'Published Successfully!'; 
                document.getElementById('postForm').reset(); 
                quill.setContents([]);
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

        try {
            const response = await fetch(`${API_URL}/posts/${id}`, { 
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }, 
                body: JSON.stringify({ title: document.getElementById('editPostTitle').value, category: document.getElementById('editPostCategory').value, fileUrl: document.getElementById('editFileUrl').value, content: editQuill.root.innerHTML }) 
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
