function trackSiteEvent(eventName, params = {}) {
    if (typeof gtag === 'function') {
        gtag('event', eventName, params);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    trackSiteEvent('site_loaded', {
        event_category: 'engagement',
        event_label: window.location.pathname
    });

    document.querySelectorAll('a[href*="wa.me"]').forEach((link) => {
        link.addEventListener('click', () => {
            trackSiteEvent('whatsapp_click', {
                event_category: 'conversion',
                event_label: link.textContent.trim() || 'whatsapp'
            });
        });
    });

    document.querySelectorAll('.nav-list a[href^="#"]').forEach((link) => {
        link.addEventListener('click', () => {
            trackSiteEvent('section_navigation', {
                event_category: 'navigation',
                event_label: link.getAttribute('href')
            });
        });
    });

    const contactForm = document.getElementById('form-contato');
    if (contactForm) {
        contactForm.addEventListener('submit', () => {
            trackSiteEvent('contact_form_submit', {
                event_category: 'lead',
                event_label: 'contact_form'
            });
        });
    }
});
