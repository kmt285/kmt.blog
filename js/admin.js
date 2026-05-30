// js/admin.js

const API_URL = 'https://kmt285476.onrender.com/'; 

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Initialize Quill Editor
    const quill = new Quill('#editor-container', {
        theme: 'snow',
        placeholder: 'Write your content here...',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image', 'video'],
                ['clean']
            ]
        }
    });

    // Check if already logged in (Session validation)
    const token = localStorage.getItem('adminToken');
    if (token) {
        showDashboard();
    }

    // --- Login Logic ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Login အောင်မြင်ပါက Token ကို သိမ်းဆည်းမည်
                localStorage.setItem('adminToken', data.token);
                showDashboard();
            } else {
                document.getElementById('loginError').innerText = data.message || 'Login failed';
            }
        } catch (err) {
            console.error(err);
            document.getElementById('loginError').innerText = 'Server error. Please try again.';
        }
    });

    // --- Logout Logic ---
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        document.getElementById('loginForm').reset();
    });

    // --- Switch UI to Dashboard ---
    function showDashboard() {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        loadCategories();
    }

    // --- Fetch Categories for Dropdown ---
    async function loadCategories() {
        try {
            const response = await fetch(`${API_URL}/categories`);
            const categories = await response.json();
            const select = document.getElementById('postCategory');
            select.innerHTML = '<option value="" disabled selected>Select a category</option>';
            categories.forEach(cat => {
                select.innerHTML += `<option value="${cat._id}">${cat.name}</option>`;
            });
        } catch (err) {
            console.error('Failed to load categories', err);
        }
    }

    // --- Create Category Logic ---
    document.getElementById('categoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('newCategoryName').value;
        
        try {
            const response = await fetch(`${API_URL}/categories`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}` // Token ဖြင့် အတည်ပြုခြင်း
                },
                body: JSON.stringify({ name })
            });

            if (response.ok) {
                document.getElementById('catMessage').innerText = 'Category added!';
                document.getElementById('newCategoryName').value = '';
                loadCategories(); // Dropdown ကို update လုပ်ရန်
                setTimeout(() => document.getElementById('catMessage').innerText = '', 3000);
            }
        } catch (err) {
            console.error('Error creating category', err);
        }
    });

    // --- Create Post Logic ---
    document.getElementById('postForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('postTitle').value;
        const category = document.getElementById('postCategory').value;
        const fileUrl = document.getElementById('fileUrl').value;
        const content = quill.root.innerHTML; // Get formatted HTML from Editor

        try {
            const response = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ title, category, content, fileUrl })
            });

            if (response.ok) {
                document.getElementById('postMessage').innerText = 'Post published successfully!';
                document.getElementById('postForm').reset();
                quill.setContents([]); // Clear editor
                setTimeout(() => document.getElementById('postMessage').innerText = '', 3000);
            }
        } catch (err) {
            console.error('Error publishing post', err);
        }
    });
});
