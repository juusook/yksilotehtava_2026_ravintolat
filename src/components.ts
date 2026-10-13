import {Restaurant} from './types/Restaurant';

// 1. Ravintolarivi taulukkoon
const restaurantRow = (restaurant: Restaurant, isNearest: boolean = false) => {
  const {name, address, company} = restaurant;
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

// 2. Päivän ruokalistan HTML-taulukko
const dailyMenuTable = (courses?: any[]) => {
  if (!courses || courses.length === 0) {
    return '<p>Ei ruokalistaa saatavilla tälle päivälle.</p>';
  }

  let html = `
    <table>
      <tr>
        <th>Course</th>
        <th>Diet</th>
        <th>Price</th>
      </tr>
  `;

  courses.forEach((course) => {
    const {name, diets, price} = course;
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

// 3. Viikon ruokalistan HTML (käy läpi jokaisen päivän)
const weeklyMenuTable = (days?: any[]) => {
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

// 4. Modaalin pohjarakenne
const restaurantModal = (
  restaurant: Restaurant,
  menuHtml: string,
  activeTab: 'daily' | 'weekly' = 'daily'
) => {
  const {name, address, city, postalCode, phone, company} = restaurant;

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

// 5. Virhemodaali
const errorModal = (message: string) => {
  const html = `
    <button class="close-btn" type="button">&times;</button>
    <h3>Error</h3>
    <p>${message}</p>
  `;
  return html;
};

export {
  restaurantRow,
  restaurantModal,
  errorModal,
  dailyMenuTable,
  weeklyMenuTable,
};
