import {Restaurant} from './types/Restaurant';

// Ravintolarivi taulukkoon
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
    <span class='restaurant-name'>${name}</span> ${nearestBadge}
    <span class="badge ${companyClass}">${company}</span>`;

  const addressCell = document.createElement('td');
  addressCell.innerText = address;

  tr.appendChild(nameCell);
  tr.appendChild(addressCell);
  return tr;
};

// Päivän ruokalistan HTML-taulukko
const dailyMenuTable = (courses?: any[]) => {
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

// Viikon ruokalistan HTML (käy läpi jokaisen päivän)
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


const restaurantModal = (
  restaurant: Restaurant,
  menuHtml: string,
  activeTab: 'daily' | 'weekly' = 'daily'
) => {
  const {name, address, city, postalCode, phone, company} = restaurant;

  const mapQuery = encodeURIComponent(`${address}, ${postalCode} ${city}`);

  const html = `
    <button class="close-btn" type="button">&times;</button>

    <div class="modal-info-container">

    <div class="modal-info">
      <h3>${name}</h3>
      <p>${company}</p>
      <p>${address} ${postalCode} ${city}</p>
      <p>${phone}</p>
    </div>

    <div class="map-container">
        <iframe
          title="Ravintolan sijainti kartalla"
          width="100%"
          height="200"
          style="border:0;"
          loading="lazy"
          src="https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed">
        </iframe>

      </div>
    </div>

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
