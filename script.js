// --- script.js CON LÍMITE 50 Y REVISIÓN DE TOKEN ---
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://3a0fc07e-f004-412d-ae83-c6d07758a21c-00-1np5o5m5hdt66.worf.replit.dev';
    const productGrid = document.getElementById('product-grid');
    const categoryNav = document.getElementById('category-nav');
    const currentCategoryTitle = document.getElementById('current-category-title');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessageDiv = document.getElementById('error-message');

    const consultationModal = document.getElementById('consultation-modal');
    const consultationProductNameModal = document.getElementById('consultation-product-name-modal');
    const copyPasteMessageText = document.getElementById('copy-paste-message-text');
    const signalContactLink = document.getElementById('signal-contact-link');
    const simplexContactLink = document.getElementById('simplex-contact-link');

    const productDetailsModal = document.getElementById('product-details-modal');
    const modalProductImage = document.getElementById('modal-product-image');
    const modalProductTitle = document.getElementById('modal-product-title');
    const modalProductRating = document.getElementById('modal-product-rating');
    const modalProductPriceUSD = document.getElementById('modal-product-price-val-usd');
    const modalProductPriceBTC = document.getElementById('modal-product-price-val-btc');
    const modalProductSpecsList = document.getElementById('modal-product-specs-list');
    const modalProductDescription = document.getElementById('modal-product-description');
    const modalEbayLink = document.getElementById('modal-ebay-link');
    const modalConsultButton = document.getElementById('modal-consult-button');

    let ebayTokenInMemory = null;
    let currentProductsData = [];

    const PRODUCT_CACHE_DURATION_MS = 24 * 60 * 60 * 1000;
    const TOKEN_CACHE_KEY = 'ebay_api_token_data_v2';
    const TOKEN_CACHE_DURATION_MS = 115 * 60 * 1000;

    const signalBaseUrl = "https://signal.me/#eu/CF1rj5AIaTA5K3wXO-BE2MTR4NTSwNRxNG0y0eb58RW7cYpZSJdLdoWQiR9wgqEY";
    const simplexFullUrl = "https://simplex.chat/invitation#/?v=2-7&smp=smp%3A%2F%2F0YuTwO05YJWS8rkjn9eLJDjQhFKvIYd8d4xG8X1blIU%3D%40smp8.simplex.im%2FvRrCr5pFnLpkU6W88_4MXi2-ONqihXPg%23%2F%3Fv%3D1-4%26dh%3DMCowBQYDK2VuAyEAOI2_lERj4RuKhypEyNWdfJnxaWtlFUeFUktxR2hlY24%253D%26q%3Dm%26k%3Ds%26srv%3Dbeccx4yfxxbvyhqypaavemqurytl6hozr47wfc7uuecacjqdvwpw2xid.onion&e2e=v%3D2-3%26x3dh%3DMEIwBQYDK2VvAzkAD5TfPW3hXr9pSw9omGm6GY-NnhA4UiflAY-zBWZ3EOCsnvrz24PIAatHMZ8BeRaDVUgZAOE0Ni4%3D%2CMEIwBQYDK2VvAzkAlbmQJKqF8oYipNeRq3CA6igbMUVwVP3V27qk2f65ImQe_b2Rc7vbE5cBs80PQD8bac1Il3GNXeg%3D";

    const categories = [
        { name: 'Destacados', query: 'popular electronics' },
        { name: 'Relojes', query: 'luxury watches men women' },
        { name: 'Celulares', query: 'smartphones unlocked' },
        { name: 'Walkie Talkies', query: 'professional walkie talkie' },
        { name: 'Joyas', query: 'fine jewelry' },
        { name: 'Perfumes', query: 'designer perfume' },
        { name: 'Anteojos', query: 'designer sunglasses' },
        { name: 'Equipo Médico', query: 'stethoscope blood pressure monitor' },
        { name: 'Scanner Automotriz', query: 'automotive diagnostic scanner' },
        { name: 'Fuentes de Poder', query: 'pc power supply' },
        { name: 'Escapes Inox', query: 'stainless steel exhaust system' },
        { name: 'Luces Tácticas', query: 'tactical flashlight high lumen' },
        { name: 'Bolígrafos Tácticos', query: 'tactical pen' },
        { name: 'Tarjetas Gráficas', query: 'graphics card gaming' },
        { name: 'Zapatos (Diseñador)', query: 'designer shoes' },
        { name: 'Ropa de Invierno', query: 'winter coat' },
        { name: 'Ropa Táctica', query: 'tactical pants' },
        { name: 'Ropa Deportiva', query: 'sports shoes' },
        { name: 'Mochilas Tácticas', query: 'tactical backpack' },
        { name: 'Telescopios', query: 'telescope astronomical' },
        { name: 'Microscopios', query: 'microscope biological digital' },
        { name: 'Generadores Eólicos', query: 'wind turbine generator residential' },
        { name: 'Paneles Solares', query: 'solar panel kit residential' },
    ];

    function getFromCache(key) {
        const cachedItem = localStorage.getItem(key);
        if (!cachedItem) return null;
        try {
            const parsedItem = JSON.parse(cachedItem);
            if (Date.now() > parsedItem.expiry) {
                localStorage.removeItem(key); console.log(`[Cache] Expirada: ${key}`); return null;
            }
            console.log(`[Cache] Desde caché: ${key}`); return parsedItem.value;
        } catch (e) {
            console.error(`[Cache] Error parseando ${key}:`, e); localStorage.removeItem(key); return null;
        }
    }

    function saveToCache(key, value, durationMs) {
        const itemToCache = { value: value, expiry: Date.now() + durationMs };
        try {
            localStorage.setItem(key, JSON.stringify(itemToCache));
            console.log(`[Cache] Guardado: ${key} (duración: ${Math.round(durationMs / 60000)} mins)`);
        } catch (e) { console.error(`[Cache] Error guardando ${key}:`, e); }
    }

    async function fetchEbayToken(forceRefresh = false) {
        if (!forceRefresh && ebayTokenInMemory) {
            console.log("[Token] Usando token desde memoria de sesión.");
            return ebayTokenInMemory;
        }
        let cachedTokenData = null;
        if (!forceRefresh) {
            cachedTokenData = getFromCache(TOKEN_CACHE_KEY);
        }
        if (cachedTokenData && cachedTokenData.access_token) {
            ebayTokenInMemory = cachedTokenData.access_token;
            console.log("[Token] Usando token desde caché localStorage.");
            return ebayTokenInMemory;
        }
        console.log("[Token] Solicitando NUEVO token desde API (forzado o no en caché/expirado).");
        try {
            const response = await fetch(`${API_BASE_URL}/api/get-ebay-token`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `GET token error: ${response.status}`);
            }
            const tokenData = await response.json();
            if (!tokenData.access_token) {
                throw new Error("Respuesta de token API no contiene access_token.");
            }
            ebayTokenInMemory = tokenData.access_token;
            const tokenValidDurationMs = tokenData.expires_in
                ? (tokenData.expires_in * 1000 * 0.95)
                : TOKEN_CACHE_DURATION_MS;
            saveToCache(TOKEN_CACHE_KEY, tokenData, tokenValidDurationMs);
            console.log("[Token] Nuevo token obtenido y cacheado.");
            return ebayTokenInMemory;
        } catch (error) {
            console.error('[Frontend] Error crítico al obtener/procesar token de eBay:', error);
            showError('Error crítico al obtener token de eBay. Intente recargar.');
            ebayTokenInMemory = null;
            return null;
        }
    }

    async function fetchProducts(query, categoryName, limit = 50, offset = 0) {
        showLoading(true); showError(null);
        currentCategoryTitle.textContent = categoryName || 'Resultados de Búsqueda';
        const CACHE_KEY_PRODUCTS = `ebay_products_${encodeURIComponent(query)}_limit${limit}_offset${offset}`;
        const cachedProducts = getFromCache(CACHE_KEY_PRODUCTS);

        if (cachedProducts) {
            currentProductsData = cachedProducts; displayProducts(currentProductsData, categoryName, false);
            showLoading(false); return;
        }

        const token = await fetchEbayToken();
        if (!token) {
            console.warn("[Frontend] No se pudo obtener un token válido para buscar productos.");
            showLoading(false);
            displayProducts([], categoryName, false);
            return;
        }

        const searchUrl = `${API_BASE_URL}/api/search-ebay?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`;
        try {
            let response = await fetch(searchUrl, { headers: { 'X-Ebay-App-Token': token } });
            
            if (response.status === 401) {
                console.warn("[Frontend] Error 401: Token inválido o expirado. Intentando refrescar token y reintentar...");
                const newToken = await fetchEbayToken(true);
                if (newToken) {
                    response = await fetch(searchUrl, { headers: { 'X-Ebay-App-Token': newToken } });
                } else {
                    throw new Error("No se pudo obtener un token nuevo tras fallo de autorización.");
                }
            }
            
            if (!response.ok) {
                let eMsg = `Error servidor (${response.status})`;
                try { const eD = await response.json(); eMsg = eD.error || eD.message || eMsg; } catch (e) {}
                throw new Error(eMsg + ` al buscar "${categoryName}".`);
            }

            const data = await response.json();
            let itemsArray = [];
            if (data) {
                if (Array.isArray(data.itemSummaries)) itemsArray = data.itemSummaries;
                else if (Array.isArray(data.items)) itemsArray = data.items;
                else if (Array.isArray(data)) itemsArray = data;
                else console.warn(`[Frontend] Para "${categoryName}", respuesta NO esperada.`, data);
            } else console.warn(`[Frontend] Para "${categoryName}", respuesta API nula.`);
            
            currentProductsData = itemsArray;
            if (currentProductsData.length > 0) saveToCache(CACHE_KEY_PRODUCTS, currentProductsData, PRODUCT_CACHE_DURATION_MS);
            displayProducts(currentProductsData, categoryName, true);

        } catch (error) {
            console.error(`[Frontend] Error fetchProducts para "${categoryName}":`, error);
            showError(`Error al cargar "${categoryName}": ${error.message}.`);
            currentProductsData = []; displayProducts(currentProductsData, categoryName, false);
        } finally {
            showLoading(false);
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function displayProducts(itemsToDisplay, categoryNameForMsg, randomizeOrder = false) {
        productGrid.innerHTML = '';
        if (!Array.isArray(itemsToDisplay)) {
            itemsToDisplay = [];
        }
        let finalItems = [...itemsToDisplay];
        if (randomizeOrder && finalItems.length > 0) {
            finalItems = shuffleArray(finalItems);
        }
        if (finalItems.length === 0) {
            productGrid.innerHTML = `<p style="text-align:center; grid-column: 1 / -1; font-size: 1.1em; padding: 20px;">No se encontraron productos para "${categoryNameForMsg}".</p>`;
            return;
        }
        finalItems.forEach((item, index) => {
            const card = document.createElement('div'); card.className = 'product-card';
            const originalIndex = currentProductsData.findIndex(oi => oi.itemId === item.itemId);
            card.dataset.index = (originalIndex !== -1) ? originalIndex : index;
            
            let bestImageUrl = 'https://via.placeholder.com/300x250.png?text=No+Image';
            let sourceImageUrl = null;
            if (item.image?.imageUrl) sourceImageUrl = item.image.imageUrl;
            else if (item.thumbnailImages?.[0]?.imageUrl) sourceImageUrl = item.thumbnailImages[0].imageUrl;
            else if (item.additionalImages?.[0]?.imageUrl) sourceImageUrl = item.additionalImages[0].imageUrl;
            
            if (sourceImageUrl) {
                bestImageUrl = sourceImageUrl;
                if (bestImageUrl.includes('s-l')) bestImageUrl = bestImageUrl.replace(/s-l\d+/ig, 's-l1600');
            }
            
            const imageUrl = bestImageUrl;
            const title = item.title || 'Producto';
            const price = item.price?.value ? parseFloat(item.price.value) : 0;
            const currency = item.price?.currency || 'USD';
            const itemId = item.itemId || `temp_${Date.now()}_${index}`;
            const rating = Math.floor(Math.random() * 3) + 3;
            let starsHTML = '';
            for (let i = 1; i <= 5; i++) starsHTML += `<i class="${i <= rating ? 'fas' : 'far'} fa-star"></i>`;
            
            card.innerHTML = `
                <div class="product-card-image-wrapper"><img src="${imageUrl}" alt="${title.substring(0, 50)}..." loading="lazy" onerror="this.onerror=null;this.src='${sourceImageUrl || 'https://via.placeholder.com/300x250.png?text=Error+Img'}';"></div>
                <div class="product-info"><h3>${title}</h3><div class="star-rating">${starsHTML}</div><p class="product-price">${price.toFixed(2)} <span class="currency">${currency}</span></p><p class="product-price-btc">${price.toFixed(2)} <span class="currency">BTCPY1</span></p><button class="consult-button" data-item-id="${itemId}" data-item-title="${title}">Consultar</button></div>`;
            productGrid.appendChild(card);
            
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('consult-button')) {
                    openConsultationModal(e.target.dataset.itemTitle, e.target.dataset.itemId);
                } else {
                    const pIdx = parseInt(e.currentTarget.dataset.index, 10);
                    const pData = currentProductsData[pIdx];
                    if (pData) openProductDetailsModal(pData);
                }
            });
        });
    }
    
    function populateCategories() {
        categories.forEach((cat, idx) => {
            const btn = document.createElement('button');
            btn.textContent = cat.name;
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('#category-nav button').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                fetchProducts(cat.query, cat.name);
            });
            categoryNav.appendChild(btn);
            if (idx === 0) {
                btn.classList.add('active');
                fetchProducts(cat.query, cat.name);
            }
        });
    }

    function showLoading(isLoading) { loadingIndicator.style.display = isLoading ? 'block' : 'none'; }
    function showError(message) { errorMessageDiv.style.display = message ? 'block' : 'none'; errorMessageDiv.textContent = message || ''; }

    function openConsultationModal(productTitle, productItemId) {
        consultationProductNameModal.textContent = productTitle;
        const msg = `Hola, estoy interesado/a en el producto: "${productTitle}" (ID: ${productItemId}). Me gustaría saber más sobre cómo adquirirlo con BTCPY1.`;
        copyPasteMessageText.value = msg;
        signalContactLink.href = `${signalBaseUrl}?message=${encodeURIComponent(msg)}`;
        simplexContactLink.href = simplexFullUrl;
        consultationModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function openProductDetailsModal(productData) {
        let bestModalImgUrl = 'https://via.placeholder.com/300x350.png?text=No+Image';
        let srcModalImgUrl = null;
        if (productData.image?.imageUrl) srcModalImgUrl = productData.image.imageUrl;
        else if (productData.thumbnailImages?.[0]?.imageUrl) srcModalImgUrl = productData.thumbnailImages[0].imageUrl;
        else if (productData.additionalImages?.[0]?.imageUrl) srcModalImgUrl = productData.additionalImages[0].imageUrl;
        
        if (srcModalImgUrl) {
            bestModalImgUrl = srcModalImgUrl;
            if (bestModalImgUrl.includes('s-l')) bestModalImgUrl = bestModalImgUrl.replace(/s-l\d+/ig, 's-l1600');
        }
        
        modalProductImage.src = bestModalImgUrl;
        modalProductImage.onerror = function() { this.onerror = null; this.src = srcModalImgUrl || 'https://via.placeholder.com/300x350.png?text=Error+Img'; };
        modalProductTitle.textContent = productData.title || 'Producto';
        const rating = Math.floor(Math.random() * 3) + 3;
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) starsHTML += `<i class="${i <= rating ? 'fas' : 'far'} fa-star"></i>`;
        modalProductRating.innerHTML = starsHTML;
        
        const price = productData.price?.value ? parseFloat(productData.price.value) : 0;
        modalProductPriceUSD.textContent = `${price.toFixed(2)} ${productData.price?.currency || 'USD'}`;
        modalProductPriceBTC.textContent = `${price.toFixed(2)} BTCPY1`;
        
        modalProductSpecsList.innerHTML = '';
        const specs = productData.localizedAspects || [];
        let specsCount = 0;
        if (specs.length > 0) {
            specs.forEach(spec => {
                if (specsCount < 8) {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${spec.name || 'Caract.'}:</strong> ${spec.value || 'N/E'}`;
                    modalProductSpecsList.appendChild(li);
                    specsCount++;
                }
            });
        }
        if (productData.condition && !specs.some(s => s.name?.toLowerCase() === 'condition')) {
            const li = document.createElement('li');
            li.innerHTML = `<strong>Condición:</strong> ${productData.condition}`;
            modalProductSpecsList.appendChild(li);
            specsCount++;
        }
        if (specsCount === 0) modalProductSpecsList.innerHTML = '<li>No hay especificaciones detalladas.</li>';
        
        modalProductDescription.textContent = productData.shortDescription || 'Descripción detallada no disponible. Por favor, visite el enlace de eBay o utilice el botón "Consultar" para más información.';
        modalEbayLink.href = productData.itemWebUrl || '#';
        modalConsultButton.onclick = () => { closeModal(productDetailsModal); openConsultationModal(productData.title, productData.itemId || `temp_${Date.now()}`); };
        
        productDetailsModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modalEl) {
        if (modalEl) {
            modalEl.classList.remove('active');
            if (!document.querySelector('.modal.active')) document.body.style.overflow = 'auto';
        }
    }

    document.querySelectorAll('.close-modal-button').forEach(btn => btn.addEventListener('click', (e) => closeModal(e.target.closest('.modal'))));
    window.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) closeModal(e.target); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.querySelectorAll('.modal.active').forEach(closeModal); });

    populateCategories();
});
