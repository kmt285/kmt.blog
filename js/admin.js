const API_URL = 'https://kmt285476.onrender.com/api'; 

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Editors
    
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
            // ပုံများကို ဆွဲချဲ့ရန်နှင့် Align လုပ်ရန် Module သစ်
            imageResize: {
                displayStyles: { backgroundColor: 'black', border: 'none', color: 'white' },
                modules: [ 'Resize', 'DisplaySize', 'Toolbar' ]
            }
        } 
    };

    const quill = new Quill('#editor-container', quillConfig);
    const editQuill = new Quill('#edit-editor-container', quillConfig);


    const token = localStorage.getItem('adminToken');
    if (token) showDashboard();

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: document.getElementById('username').value, password: document.getElementById('password').value })
            });
            const data = await res.json();
            if (res.ok) { localStorage.setItem('adminToken', data.token); showDashboard(); }
            else { document.getElementById('loginError').innerText = data.message; }
        } catch (err) { console.error(err); }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        loginSection.classList.remove('hidden'); dashboardSection.classList.add('hidden');
    });

    function showDashboard() {
        loginSection.classList.add('hidden'); dashboardSection.classList.remove('hidden');
        loadCategories(); loadAdminPosts();
    }

// --- Categories များကို ဆွဲယူခြင်းနှင့် UI တွင် ပြသခြင်း ---
    async function loadCategories() {
        try {
            const res = await fetch(`${API_URL}/categories`);
            const categories = await res.json();
            
            const createSelect = document.getElementById('postCategory');
            const editSelect = document.getElementById('editPostCategory');
            const catList = document.getElementById('categoryList'); // HTML မှ list ကို ဖမ်းယူခြင်း

            createSelect.innerHTML = '<option value="" disabled selected>Select</option>';
            editSelect.innerHTML = '<option value="" disabled selected>Select</option>';
            catList.innerHTML = ''; // စာရင်းကို အရင်ရှင်းထုတ်မည်

            categories.forEach(cat => {
                const opt = `<option value="${cat._id}">${cat.name}</option>`;
                createSelect.innerHTML += opt; 
                editSelect.innerHTML += opt;

                // Category စာရင်းထဲသို့ နာမည်နှင့် Delete ခလုတ် ထည့်ခြင်း
                catList.innerHTML += `
                    <li style="display: flex; justify-content: space-between; padding: 0.8rem; border-bottom: 1px solid #f1f3f5; align-items: center;">
                        <span style="font-weight: 500;">${cat.name}</span>
                        <button class="del-cat-btn" data-id="${cat._id}" style="color: red; background: none; border: none; cursor: pointer; font-weight: bold;">Delete</button>
                    </li>
                `;
            });
        } catch (err) { console.error('Failed to load categories', err); }
    }

    // --- Category ဖျက်မည့် ခလုတ်ကို နှိပ်သောအခါ ---
    document.getElementById('categoryList').addEventListener('click', async (e) => {
        if (e.target.classList.contains('del-cat-btn')) {
            if (confirm('Are you sure you want to delete this category? (Note: Posts under this category will become Uncategorized)')) {
                const id = e.target.getAttribute('data-id');
                try {
                    const res = await fetch(`${API_URL}/categories/${id}`, { 
                        method: 'DELETE', 
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } 
                    });
                    if (res.ok) {
                        loadCategories(); // စာရင်းကို အသစ်ပြန်ခေါ်မည်
                        loadAdminPosts(); // ဇယားကိုပါ အသစ်ပြန်ခေါ်မည်
                    }
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

    // Handle Edit & Delete Button Clicks in Table
    document.getElementById('adminPostList').addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        
        // Delete Action
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this post?')) {
                await fetch(`${API_URL}/posts/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } });
                loadAdminPosts();
            }
        }
        
        // Edit Action
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

    // Create Category
    document.getElementById('categoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await fetch(`${API_URL}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }, body: JSON.stringify({ name: document.getElementById('newCategoryName').value }) });
        document.getElementById('catMessage').innerText = 'Added!'; document.getElementById('newCategoryName').value = '';
        loadCategories(); setTimeout(() => document.getElementById('catMessage').innerText = '', 2000);
    });

    // Create Post
    document.getElementById('postForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await fetch(`${API_URL}/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }, 
            body: JSON.stringify({ title: document.getElementById('postTitle').value, category: document.getElementById('postCategory').value, fileUrl: document.getElementById('fileUrl').value, content: quill.root.innerHTML }) 
        });
        document.getElementById('postMessage').innerText = 'Published!'; document.getElementById('postForm').reset(); quill.setContents([]);
        loadAdminPosts(); setTimeout(() => document.getElementById('postMessage').innerText = '', 2000);
    });

    // Update Post
    document.getElementById('editPostForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editPostId').value;
        await fetch(`${API_URL}/posts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }, 
            body: JSON.stringify({ title: document.getElementById('editPostTitle').value, category: document.getElementById('editPostCategory').value, fileUrl: document.getElementById('editFileUrl').value, content: editQuill.root.innerHTML }) 
        });
        document.getElementById('editPostMessage').innerText = 'Updated!';
        loadAdminPosts();
        setTimeout(() => { document.getElementById('editPostMessage').innerText = ''; document.getElementById('cancelEditBtn').click(); }, 1500);
    });
});
