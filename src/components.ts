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

    <div class="modal-nav-row">
      <div class="menu-tabs">
        <button id="tab-daily" class="tab-btn ${activeTab === 'daily' ? 'active' : ''}">Päivän lista</button>
        <button id="tab-weekly" class="tab-btn ${activeTab === 'weekly' ? 'active' : ''}">Viikon lista</button>
      </div>
      <button id="add-favorite-btn">Lisää suosikiksi</button>
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

// Kirjautumis- ja rekisteröitymismodaali
const authorizationModal = (type: 'login' | 'register' = 'login') => {
  return `
    <button class="close-btn">&times;</button>
    <div class="auth-container">
      <div class="menu-tabs">
        <button id="auth-tab-login" class="tab-button ${type === 'login' ? 'active' : ''}">Kirjaudu</button>
        <button id="auth-tab-register" class="tab-button ${type === 'register' ? 'active' : ''}">Rekisteröidy</button>
      </div>

      <div id="auth-form-container">
        ${type === 'login' ? loginFormHtml() : registerFormHtml()}
      </div>
    </div>
  `;
};

const loginFormHtml = () => `
  <form id="login-form" class="auth-form">
    <h3>Kirjaudu sisään</h3>
    <div class="form-group">
      <label for="username">Käyttäjätunnus</label>
      <input type="text" id="username" name="username" required autocomplete="username" />
    </div>
    <div class="form-group">
      <label for="password">Salasana</label>
      <input type="password" id="password" name="password" required autocomplete="current-password" />
    </div>
    <p id="auth-error" class="error-text"></p>
    <button type="submit" class="submit-btn">Kirjaudu</button>
  </form>
`;

const registerFormHtml = () => `
  <form id="register-form" class="auth-form">
    <h3>Luo uusi tili</h3>
    <div class="form-group">
      <label for="reg-username">Käyttäjätunnus</label>
      <input type="text"
      id="reg-username"
      name="username"
      required
      autocomplete="username"
      minlength="3"
      placeholder="esim. PaavoPesusieni"
      />
    </div>

    <div class="form-group">
      <label for="reg-email">Sähköposti</label>
      <input type="email"
      id="reg-email"
      name="email"
      required
      placeholder="paavopesu@sieni.fi"
      />
    </div>

    <div class="form-group">
      <label for="reg-password">Salasana</label>
      <input type="password"
      id="reg-password"
      name="password"
      required
      pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}"
      title="Salasanan tulee sisältää vähintään 8 merkkiä, joista yksi iso kirjain, yksi pieni kirjain, yksi numero ja yksi erikoismerkki (@$!%*?&)."
      />
    </div>
    <p id="auth-error" class="error-text"></p>
    <button type="submit" class="submit-btn">Rekisteröidy</button>
  </form>
`;

export {
  restaurantRow,
  restaurantModal,
  errorModal,
  dailyMenuTable,
  weeklyMenuTable,
  authorizationModal,
  loginFormHtml,
  registerFormHtml,
};
