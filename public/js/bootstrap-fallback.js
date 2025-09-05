/* Minimal Bootstrap JavaScript Fallback */

// Simple dropdown and collapse functionality
document.addEventListener('DOMContentLoaded', function() {
    // Navbar toggle functionality
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler && navbarCollapse) {
        navbarToggler.addEventListener('click', function() {
            navbarCollapse.classList.toggle('show');
        });
    }
    
    // Basic dropdown functionality
    const dropdownToggles = document.querySelectorAll('[data-bs-toggle="dropdown"]');
    dropdownToggles.forEach(function(toggle) {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const menu = toggle.nextElementSibling;
            if (menu && menu.classList.contains('dropdown-menu')) {
                menu.classList.toggle('show');
            }
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('[data-bs-toggle="dropdown"]')) {
            const openMenus = document.querySelectorAll('.dropdown-menu.show');
            openMenus.forEach(menu => menu.classList.remove('show'));
        }
    });
    
    // Basic modal functionality
    const modalToggles = document.querySelectorAll('[data-bs-toggle="modal"]');
    modalToggles.forEach(function(toggle) {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(toggle.getAttribute('data-bs-target'));
            if (target) {
                target.style.display = 'block';
                target.classList.add('show');
            }
        });
    });
    
    // Close modals
    const modalCloses = document.querySelectorAll('[data-bs-dismiss="modal"]');
    modalCloses.forEach(function(close) {
        close.addEventListener('click', function() {
            const modal = close.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('show');
            }
        });
    });
});