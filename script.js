let rawData = [];
let displayData = [];
let currentPage = 1;
let pageSize = 10;

const apiURL = 'https://api.escuelajs.co/api/v1/products';

async function fetchAllProducts() {
    try {
        const response = await fetch(apiURL);
        rawData = await response.json();
        displayData = [...rawData];
        renderDashboard();
    } catch (error) {
        console.error("Lỗi gọi API:", error);
    }
}

function renderDashboard() {
    const tbody = document.getElementById('productBody');
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagedData = displayData.slice(startIndex, endIndex);

    tbody.innerHTML = pagedData.map(item => {
        // Xử lý link ảnh bị dính dấu ngoặc vuông hoặc lỗi định dạng từ API
        let imgUrl = "";
        if (item.images && item.images.length > 0) {
            imgUrl = item.images[0].replace(/[\[\]\" ]/g, ""); 
        }
        
        // Link ảnh dự phòng nếu link gốc lỗi
        const fallbackImg = "https://placehold.jp/24/333333/ffffff/60x60.png?text=No+Img";

        return `
            <tr>
                <td>
                    <img src="${imgUrl}" alt="${item.title}" 
                         onerror="this.onerror=null;this.src='${fallbackImg}';">
                </td>
                <td>${item.title}</td>
                <td>${item.price.toLocaleString()}</td>
            </tr>
        `;
    }).join('');

    renderPaginationControls();
}

function handleSearch() {
    const text = document.getElementById('searchInput').value.toLowerCase();
    displayData = rawData.filter(p => p.title.toLowerCase().includes(text));
    currentPage = 1;
    renderDashboard();
}

function handleSort() {
    const type = document.getElementById('sortSelect').value;
    if (type === 'priceAsc') displayData.sort((a, b) => a.price - b.price);
    else if (type === 'priceDesc') displayData.sort((a, b) => b.price - a.price);
    else if (type === 'nameAsc') displayData.sort((a, b) => a.title.localeCompare(b.title));
    else if (type === 'nameDesc') displayData.sort((a, b) => b.title.localeCompare(a.title));
    renderDashboard();
}

function handlePageSizeChange() {
    pageSize = parseInt(document.getElementById('pageSizeSelect').value);
    currentPage = 1;
    renderDashboard();
}

function renderPaginationControls() {
    const paginationDiv = document.getElementById('pagination');
    const totalPages = Math.ceil(displayData.length / pageSize);
    let buttons = '';
    for (let i = 1; i <= Math.min(totalPages, 10); i++) {
        buttons += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    paginationDiv.innerHTML = buttons;
}

function goToPage(page) {
    currentPage = page;
    renderDashboard();
}

fetchAllProducts();