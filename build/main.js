'use strict';

// Ravintolarivi taulukkoon
const restaurantRow = (restaurant, isNearest = false) => {
    const { name, address, company } = restaurant;
    const tr = document.createElement('tr');
    const companyClass = company.toLowerCase().includes('sodexo') ? 'sodexo' : 'compass';
    let nearestBadge = '';
    if (isNearest) {
        nearestBadge = '<span class="badge nearest">Lähin</span>';
    }
    const nameCell = document.createElement('td');
    nameCell.innerHTML = `
    ${name} ${nearestBadge}
    <span class="badge ${companyClass}">${company}</span>`;
    const addressCell = document.createElement('td');
    addressCell.innerText = address;
    tr.appendChild(nameCell);
    tr.appendChild(addressCell);
    return tr;
};
// Päivän ruokalistan HTML-taulukko
const dailyMenuTable = (courses) => {
    if (!courses || courses.length === 0) {
        return '<p>Ei ruokalistaa saatavilla tälle päivälle.</p>';
    }
    let html = `
    <table>
      <tr>
        <th>Ruokalaji</th>
        <th>Ruokavalio</th>
        <th>Hinta</th>
      </tr>
  `;
    courses.forEach((course) => {
        const { name, diets, price } = course;
        html += `
      <tr>
        <td>${name}</td>
        <td>${diets ?? ' - '}</td>
        <td>${price ?? ' - '}</td>
      </tr>
    `;
    });
    html += '</table>';
    return html;
};
// Viikon ruokalistan HTML (käy läpi jokaisen päivän)
const weeklyMenuTable = (days) => {
    if (!days || days.length === 0) {
        return '<p>Ei viikon ruokalistaa saatavilla.</p>';
    }
    let html = '';
    days.forEach((day) => {
        const date = day.date || '';
        html += `<h4>${date}</h4>`;
        html += dailyMenuTable(day.courses);
    });
    return html;
};
const restaurantModal = (restaurant, menuHtml, activeTab = 'daily') => {
    const { name, address, city, postalCode, phone, company } = restaurant;
    const html = `
    <button class="close-btn" type="button">&times;</button>
    <h3>${name}</h3>
    <p>${company}</p>
    <p>${address} ${postalCode} ${city}</p>
    <p>${phone}</p>

    <div class="menu-tabs">
      <button id="tab-daily" class="tab-btn ${activeTab === 'daily' ? 'active' : ''}">Päivän lista</button>
      <button id="tab-weekly" class="tab-btn ${activeTab === 'weekly' ? 'active' : ''}">Viikon lista</button>
    </div>

    <div id="menu-content">
      ${menuHtml}
    </div>
  `;
    return html;
};
// Virhemodaali
const errorModal = (message) => {
    const html = `
    <button class="close-btn" type="button">&times;</button>
    <h3>Error</h3>
    <p>${message}</p>
  `;
    return html;
};

const fetchData = async (url, options = {}) => {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Error ${response.status} occured`);
    }
    const json = await response.json();
    return json;
};

const apiUrl = 'https://media1.edu.metropolia.fi/restaurant/api/v1';
const positionOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
};

const modal = document.querySelector('dialog');
if (!modal) {
    throw new Error('Modal not found');
}
// Muuttuha auki olevalle ravintolle
let currentRestaurant = null;
// Tapahtumakuuntelija modaalin napeille (sulkeminen/välilehdet)
modal.addEventListener('click', async (event) => {
    const target = event.target;
    if (target.classList.contains('close-btn')) {
        modal.close();
        return;
    }
    if (!currentRestaurant)
        return;
    const menuContent = modal.querySelector('#menu-content');
    const tabDaily = modal.querySelector('#tab-daily');
    const tabWeekly = modal.querySelector('#tab-weekly');
    if (target.id === 'tab-weekly') {
        try {
            if (menuContent) {
                menuContent.innerHTML = '<p>Ladataan viikon ruokalistaa...</p>';
            }
            const weeklyData = await fetchData(apiUrl + `/restaurants/weekly/${currentRestaurant._id}/fi`);
            const days = weeklyData.days || (Array.isArray(weeklyData) ? weeklyData : []);
            if (menuContent) {
                menuContent.innerHTML = weeklyMenuTable(days);
            }
            tabDaily?.classList.remove('active');
            tabWeekly?.classList.add('active');
        }
        catch (error) {
            if (menuContent) {
                menuContent.innerHTML = '<p>Viikon ruokalistaa ei saatu haettua.</p>';
            }
        }
    }
    if (target.id === 'tab-daily') {
        try {
            if (menuContent) {
                menuContent.innerHTML = '<p>Ladataan päivän ruokalistaa...</p>';
            }
            const dailyData = await fetchData(apiUrl + `/restaurants/daily/${currentRestaurant._id}/fi`);
            if (menuContent) {
                menuContent.innerHTML = dailyMenuTable(dailyData?.courses);
            }
            tabWeekly?.classList.remove('active');
            tabDaily?.classList.add('active');
        }
        catch (error) {
            if (menuContent) {
                menuContent.innerHTML = '<p>Päivän ruokalistaa ei saatu haettua.</p>';
            }
        }
    }
});
const calculateDistance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
const createTable = (restaurants) => {
    const tbody = document.querySelector('tbody');
    if (!tbody) {
        throw new Error('Table body not found');
    }
    tbody.innerHTML = '';
    restaurants.forEach((restaurant, index) => {
        const isNearest = index === 0;
        const tr = restaurantRow(restaurant, isNearest);
        tbody.appendChild(tr);
        tr.addEventListener('click', async () => {
            try {
                currentRestaurant = restaurant;
                const allHighs = document.querySelectorAll('.highlight');
                allHighs.forEach((high) => {
                    high.classList.remove('highlight');
                });
                tr.classList.add('highlight');
                // Haetaan päivän ruokalista
                const menu = await fetchData(apiUrl + `/restaurants/daily/${restaurant._id}/fi`);
                // Luodaan ruokalistan HTML ja asetetaan se modaaliin
                const menuHtml = dailyMenuTable(menu?.courses);
                modal.innerHTML = restaurantModal(restaurant, menuHtml, 'daily');
                modal.showModal();
            }
            catch (error) {
                modal.innerHTML = errorModal(error.message);
                modal.showModal();
            }
        });
    });
};
const error = (err) => {
    console.warn(`ERROR(${err.code}): ${err.message}`);
};
const success = async (pos) => {
    try {
        const crd = pos.coords;
        const restaurants = await fetchData(apiUrl + '/restaurants');
        restaurants.sort((a, b) => {
            const x1 = crd.latitude;
            const y1 = crd.longitude;
            const x2a = a.location.coordinates[1];
            const y2a = a.location.coordinates[0];
            const distanceA = calculateDistance(x1, y1, x2a, y2a);
            const x2b = b.location.coordinates[1];
            const y2b = b.location.coordinates[0];
            const distanceB = calculateDistance(x1, y1, x2b, y2b);
            return distanceA - distanceB;
        });
        createTable(restaurants);
        // Suodatusnapit
        const sodexoBtn = document.querySelector('#sodexo');
        const compassBtn = document.querySelector('#compass');
        const resetBtn = document.querySelector('#reset');
        if (!sodexoBtn) {
            throw new Error('Sodexo button not found');
        }
        sodexoBtn.addEventListener('click', () => {
            const sodexoRestaurants = restaurants.filter((restaurant) => restaurant.company === 'Sodexo');
            createTable(sodexoRestaurants);
        });
        if (!compassBtn) {
            throw new Error('Compass button not found');
        }
        compassBtn.addEventListener('click', () => {
            const compassRestaurants = restaurants.filter((restaurant) => restaurant.company === 'Compass Group');
            createTable(compassRestaurants);
        });
        if (!resetBtn) {
            throw new Error('Reset button not found');
        }
        resetBtn.addEventListener('click', () => {
            createTable(restaurants);
        });
    }
    catch (error) {
        modal.innerHTML = errorModal(error.message);
        modal.showModal();
    }
};
navigator.geolocation.getCurrentPosition(success, error, positionOptions);
