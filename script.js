/* Arquivo: script.js */

let currentView = 'home'; 

const getDataSource = () => {
    const storedData = JSON.parse(localStorage.getItem('bandfolioData'));
    return (storedData && storedData.length > 0) ? storedData : bandsDB;
};

// --- LÓGICA DE SALVAR ---
const getSavedIds = () => JSON.parse(localStorage.getItem('bandfolio_saved')) || [];
const isSaved = (id) => getSavedIds().includes(id);

function toggleSave(event, id) {
    event.preventDefault(); 
    event.stopPropagation();
    let saved = getSavedIds();
    const index = saved.indexOf(id);
    if (index === -1) saved.push(id);
    else saved.splice(index, 1);
    localStorage.setItem('bandfolio_saved', JSON.stringify(saved));
    
    if (currentView === 'saved') renderSaved(); 
    else {
        const btn = event.currentTarget;
        btn.classList.toggle('saved');
        btn.innerHTML = btn.classList.contains('saved') ? '★' : '☆';
    }
}

// --- RENDERIZAÇÃO ---
const contentArea = document.getElementById('contentArea');
const searchInput = document.getElementById('searchInput');
const categoryList = document.getElementById('categoryList');

document.addEventListener('DOMContentLoaded', () => {
    const storedTheme = localStorage.getItem('bandfolio_theme');
    if (storedTheme === 'dark') document.body.classList.add('dark-mode');

    generateCategories();
    renderHomeWithLikes();
});

function renderHomeWithLikes() {
    currentView = 'home';
    if(searchInput) searchInput.value = '';
    contentArea.innerHTML = '<div style="text-align:center; padding:50px; color:#888;">Carregando catálogo...</div>';

    const dbData = getDataSource();

    if (typeof db === 'undefined') {
        renderFullHome(dbData, []);
        return;
    }

    db.ref('likes').once('value').then((snapshot) => {
        const likesObj = snapshot.val() || {};
        const bandsWithLikes = dbData.map(band => {
            return { ...band, likes: likesObj[band.id] || 0 };
        });
        const sortedByLikes = [...bandsWithLikes].sort((a, b) => b.likes - a.likes);
        const top5 = sortedByLikes.slice(0, 5).filter(b => b.likes > 0);
        renderFullHome(bandsWithLikes, top5);
    }).catch(error => {
        renderFullHome(dbData, []); 
    });
}

function renderFullHome(allBands, top5) {
    contentArea.innerHTML = '';

    // Renderiza seções e ativa a lógica de scroll para cada uma
    if (top5.length > 0) renderSection("🔥 Em Alta", top5, "top5");

    const newBands = allBands.filter(b => b.tags && b.tags.includes("new"));
    if (newBands.length > 0) renderSection("Lançamentos Recentes", newBands, "new");

    const hotBands = allBands.filter(b => b.tags && b.tags.includes("hot"));
    if (hotBands.length > 0) renderSection("Recomendados", hotBands, "hot");

    const classicBands = allBands.filter(b => b.tags && b.tags.includes("classic"));
    if (classicBands.length > 0) renderSection("Clássicos", classicBands, "classic");

    if (top5.length === 0 && newBands.length === 0 && hotBands.length === 0) {
        renderSection("Galeria Completa", allBands, "all");
    }
}

function renderSection(title, bands, tagType) {
    const viewAllBtn = (tagType !== 'all' && tagType !== 'top5') 
        ? `<span class="view-all" onclick="showAllByTag('${tagType}', '${title}')">Ver tudo</span>` 
        : '';
    
    // Gera ID único para identificar esta seção
    const sectionId = 'scroll-' + Math.random().toString(36).substr(2, 9);

    // Injeta HTML com botões de seta
    contentArea.innerHTML += `
        <div class="section-header">
            <h2 class="section-title">${title}</h2>
            ${viewAllBtn}
        </div>
        <div class="scroll-wrapper" id="${sectionId}">
            <button class="scroll-btn left">❮</button>
            <div class="horizontal-scroll">
                ${bands.map(createCard).join('')}
            </div>
            <button class="scroll-btn right">❯</button>
        </div>
    `;

    // Aplica a lógica de JS após o HTML ser inserido
    // Precisamos de um pequeno timeout para garantir que o DOM renderizou
    setTimeout(() => {
        addScrollLogic(document.getElementById(sectionId));
    }, 0);
}

// --- NOVA LÓGICA DE SCROLL (ARRASTAR + SETAS) ---
function addScrollLogic(wrapper) {
    if (!wrapper) return;
    
    const slider = wrapper.querySelector('.horizontal-scroll');
    const leftBtn = wrapper.querySelector('.scroll-btn.left');
    const rightBtn = wrapper.querySelector('.scroll-btn.right');
    
    // 1. SETINHAS
    leftBtn.addEventListener('click', () => {
        slider.scrollBy({ left: -300, behavior: 'smooth' });
    });
    
    rightBtn.addEventListener('click', () => {
        slider.scrollBy({ left: 300, behavior: 'smooth' });
    });

    // 2. ARRASTAR COM MOUSE (DRAG AND DROP)
    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.classList.add('active');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.classList.remove('active');
    });

    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.classList.remove('active');
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault(); // Impede seleção de texto
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2; // Velocidade do scroll (multiplique para ir mais rápido)
        slider.scrollLeft = scrollLeft - walk;
    });
}

function renderGrid(bands, title) {
    if(title !== 'Meus Salvos') currentView = 'grid';
    contentArea.innerHTML = `
        <div class="section-header">
            <h2 class="section-title">${title}</h2>
            <button class="view-all" style="background:none; border:none;" onclick="renderHomeWithLikes()">← Voltar</button>
        </div>
        <div class="section-grid">
            ${bands.length ? bands.map(createCard).join('') : '<p style="color:var(--text-muted)">Nenhum resultado encontrado.</p>'}
        </div>
    `;
}

function createCard(band) {
    const url = band.url || band.portfolioUrl || '#';
    const cityDisplay = band.city ? ` - ${band.city}` : '';
    const savedClass = isSaved(band.id) ? 'saved' : '';
    const saveIcon = isSaved(band.id) ? '★' : '☆';
    
    const likeDisplay = (band.likes !== undefined && band.likes > 0)
        ? `<div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0, 0, 0, 0.6); color: #fff; padding: 2px 8px; border-radius: 2px; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 4px; backdrop-filter: blur(2px); z-index: 5;">♥ ${band.likes}</div>`
        : '';

    return `
        <div class="card-wrapper">
            <a href="${url}" class="card" draggable="false"> <div class="card-cover">
                    <img src="${band.image || 'https://placehold.co/400x300/e0e0e0/1a1a1a?text=No+Image'}" class="card-img" alt="${band.name}" loading="lazy">
                    <button class="save-btn ${savedClass}" onclick="toggleSave(event, ${band.id})" title="Salvar">${saveIcon}</button>
                    ${likeDisplay}
                </div>
                <div class="card-info">
                    <h4>${band.name}</h4>
                    <p>${band.genre}${cityDisplay}</p>
                </div>
            </a>
        </div>
    `;
}

function renderSaved() {
    currentView = 'saved';
    const savedIds = getSavedIds();
    const db = getDataSource();
    const savedBands = db.filter(band => savedIds.includes(band.id));

    contentArea.innerHTML = `
        <div class="section-header">
            <h2 class="section-title">Meus Salvos</h2>
            <button class="view-all" style="background:none; border:none;" onclick="renderHomeWithLikes()">← Voltar</button>
        </div>
    `;

    if (savedBands.length > 0) {
        contentArea.innerHTML += `<div class="section-grid">${savedBands.map(createCard).join('')}</div>`;
    } else {
        contentArea.innerHTML += `
            <div style="text-align:center; padding: 4rem 0; color: var(--text-muted);">
                <p style="font-size: 1.1rem; margin-bottom: 1rem;">Sua coleção está vazia.</p>
                <button onclick="renderHomeWithLikes()" 
                    style="background:var(--accent); color:var(--bg-body); border:none; padding:12px 24px; border-radius:2px; cursor:pointer; font-weight:600; text-transform:uppercase; letter-spacing:1px; font-size:0.8rem;">
                    Explorar Catálogo
                </button>
            </div>
        `;
    }
}

function generateCategories() {
    const db = getDataSource();
    const genres = [...new Set(db.map(b => b.genre))].sort();
    let html = ``;
    genres.forEach(genre => html += `<div class="category-item" onclick="filterByCategory('${genre}')">${genre}</div>`);
    categoryList.innerHTML = html;
}

function filterByCategory(genre) {
    const filtered = getDataSource().filter(b => b.genre === genre);
    renderGrid(filtered, genre);
}

function showAllByTag(tag, title) {
    const filtered = getDataSource().filter(b => b.tags && b.tags.includes(tag));
    renderGrid(filtered, title);
}

if(searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        currentView = 'search';
        if (term === '') { renderHomeWithLikes(); return; }
        const filtered = getDataSource().filter(b => 
            b.name.toLowerCase().includes(term) || b.genre.toLowerCase().includes(term) || (b.city && b.city.toLowerCase().includes(term))
        );
        renderGrid(filtered, `Busca: "${term}"`);
    });
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('bandfolio_theme', isDark ? 'dark' : 'light');
}

window.renderHome = renderHomeWithLikes;