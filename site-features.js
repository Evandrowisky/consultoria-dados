function trackSiteEvent(eventName, params = {}) {
    if (typeof gtag === 'function') {
        gtag('event', eventName, params);
    }
}

function showReviewConfirmation() {
    const message = document.getElementById('review-confirmation-message');
    if (message) {
        message.style.display = 'block';
    }
    trackSiteEvent('review_submit', {
        event_category: 'reviews',
        event_label: 'review_form'
    });
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        const next = line[i + 1];

        if (char === '"' && next === '"') {
            current += '"';
            i += 1;
        } else if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

function csvToObjects(csvText) {
    const lines = csvText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length <= 1) {
        return [];
    }

    const headers = parseCSVLine(lines[0]);

    return lines.slice(1).map((line) => {
        const values = parseCSVLine(line);
        return headers.reduce((acc, header, index) => {
            acc[header] = values[index] || '';
            return acc;
        }, {});
    });
}

function renderStars(score) {
    const rating = Math.max(0, Math.min(5, Math.round(Number(score) || 0)));
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function renderReviews(reviews) {
    const approvedReviews = reviews.filter((review) => String(review.aprovado).toLowerCase() === 'true');
    const averageElement = document.getElementById('review-average');
    const starsElement = document.getElementById('review-average-stars');
    const countElement = document.getElementById('review-count');
    const listElement = document.getElementById('reviews-list');

    if (!averageElement || !starsElement || !countElement || !listElement) {
        return;
    }

    if (!approvedReviews.length) {
        averageElement.textContent = '—';
        starsElement.textContent = '☆☆☆☆☆';
        countElement.textContent = 'Nenhuma avaliação publicada ainda.';
        listElement.innerHTML = '<div class="empty-reviews"><h3>Ainda não há reviews publicados.</h3><p>Quando você aprovar avaliações na base CSV do repositório, elas aparecem automaticamente aqui com média de estrelas.</p></div>';
        return;
    }

    const average = approvedReviews.reduce((sum, review) => sum + Number(review.nota || 0), 0) / approvedReviews.length;
    averageElement.textContent = average.toFixed(1).replace('.', ',');
    starsElement.textContent = renderStars(average);
    countElement.textContent = `${approvedReviews.length} avaliação${approvedReviews.length > 1 ? 'ões' : ''} publicada${approvedReviews.length > 1 ? 's' : ''}.`;

    listElement.innerHTML = approvedReviews.map((review) => `
        <article class="review-card">
            <header>
                <div>
                    <h3>${review.nome || 'Cliente'}</h3>
                    <small>${review.empresa || 'Projeto de dados'}</small>
                </div>
                <div class="rating-stars" aria-label="Nota ${review.nota} de 5">${renderStars(review.nota)}</div>
            </header>
            <p>${review.comentario || ''}</p>
            <span class="review-service">${review.servico || 'Consultoria de dados'}</span>
        </article>
    `).join('');
}

async function loadReviews() {
    try {
        const response = await fetch('data/reviews.csv', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Não foi possível carregar a base de reviews.');
        }
        const csvText = await response.text();
        renderReviews(csvToObjects(csvText));
    } catch (error) {
        const listElement = document.getElementById('reviews-list');
        if (listElement) {
            listElement.innerHTML = '<div class="empty-reviews"><h3>Reviews indisponíveis no momento.</h3><p>Confira se o arquivo data/reviews.csv existe no repositório e está publicado no deploy.</p></div>';
        }
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

    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', showReviewConfirmation);
    }

    loadReviews();
});
