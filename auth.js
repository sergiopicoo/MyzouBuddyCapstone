
const token = localStorage.getItem('token');
const currentPage = window.location.pathname;

if (!token && currentPage !== '/index.html') {
    window.location.href = 'login.html'; 
}

