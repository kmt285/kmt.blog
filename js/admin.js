const API_URL = 'https://kmt285476.onrender.com/api'; 

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Editors
    const quillConfig = { theme: 'snow', modules: { toolbar: [ [{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['link', 'image', 'video'], ['clean'] ] } };
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

    async function loadCategories() {
        try {
            const res = await fetch(`${API_URL}/categories`);
            const categories = await res.json();
            const createSelect = document.getElementById('postCategory');
            const editSelect = document.getElementById('editPostCategory');
            createSelect.innerHTML = '<option value="" disabled selected>Select</option>';
            editSelect.innerHTML = '<option value="" disabled selected>Select</option>';
            categories.forEach(cat => {
                const opt = `<option value="${cat._id}">${cat.name}</option>`;
                createSelect.innerHTML += opt; editSelect.innerHTML += opt;
            });
        } catch (err) { console.error(err); }
    }

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
