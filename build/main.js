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
    <span class='restaurant-name'>${name}</span> ${nearestBadge}
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
const errorModal = (message) => {
    const html = `
    <button class="close-btn" type="button">&times;</button>
    <h3>Error</h3>
    <p>${message}</p>
  `;
    return html;
};
// Kirjautumis- ja rekisteröitymismodaali
const authorizationModal = (type = 'login') => {
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
      <input type="text" id="reg-username" name="username" required autocomplete="username" />
    </div>
    <div class="form-group">
      <label for="reg-email">Sähköposti</label>
      <input type="email" id="reg-email" name="email" required autocomplete="email" />
    </div>
    <div class="form-group">
      <label for="reg-password">Salasana</label>
      <input type="password" id="reg-password" name="password" required autocomplete="new-password" />
    </div>
    <p id="auth-error" class="error-text"></p>
    <button type="submit" class="submit-btn">Rekisteröidy</button>
  </form>
`;

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

// kirjautuminen
const login = async (username, password) => {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    };
    return await fetchData(`${apiUrl}/auth/login`, options);
};
// Rekisteröityminen
const register = async (userData) => {
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    };
    return await fetchData(`${apiUrl}/users`, options);
};
// Käyttäjän hakeminen tokenilla
const getUserData = async (token) => {
    const options = {
        headers: { Authorization: `Bearer ${token}` },
    };
    return await fetchData(`${apiUrl}/users/token`, options);
};

const modal = document.querySelector('dialog');
if (!modal) {
    throw new Error('Modal not found');
}
// Muuttuha auki olevalle ravintolle
let currentUser = null;
let currentRestaurant = null;
let allRestaurants = [];
// Kirjautuminen ja rekisteröityminen
const loginBtn = document.querySelector('#login-btn');
const registerBtn = document.querySelector('#register-btn');
const updateAuthButton = (user) => {
    if (loginBtn) {
        if (user) {
            loginBtn.textContent = `Kirjaudu ulos (${user.username})`;
        }
        else {
            loginBtn.textContent = 'Kirjaudu';
        }
    }
    if (registerBtn) {
        if (user) {
            registerBtn.style.display = 'none';
        }
        else {
            registerBtn.style.display = '';
        }
    }
};
if (registerBtn) {
    registerBtn.addEventListener('click', () => {
        if (!currentUser) {
            modal.innerHTML = authorizationModal('register'); // Avataan suoraan rekisteröitymisnäkymä
            modal.showModal();
        }
    });
}
// LocalStrorage tarkistus
const checkToken = async () => {
    const token = localStorage.getItem('token');
    if (!token)
        return;
    try {
        currentUser = await getUserData(token);
        updateAuthButton(currentUser);
    }
    catch (error) {
        console.warn('Token ei ole voimassa:', error);
        localStorage.removeItem('token');
        currentUser = null;
        updateAuthButton(null);
    }
};
checkToken();
// Kirjaudu ja kirjaudu ulos -kuuntelija
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        if (currentUser) {
            // Kirjaudutaan ulos
            localStorage.removeItem('token');
            currentUser = null;
            updateAuthButton(null);
            alert('Olet kirjautunut ulos.');
        }
        else {
            // Avataan kirjautumis- ja rekisteröitymismodaali
            modal.innerHTML = authorizationModal('login');
            modal.showModal();
        }
    });
}
// Tapahtumakuuntelija modaalin napeille (sulkeminen/välilehdet)
modal.addEventListener('click', async (event) => {
    const target = event.target;
    // Modaalin sulkeminen
    if (target.classList.contains('close-btn')) {
        modal.close();
        return;
    }
    if (target.id === 'auth-tab-login') {
        const container = modal.querySelector('#auth-form-container');
        if (container)
            container.innerHTML = loginFormHtml();
        modal.querySelector('#auth-tab-login')?.classList.add('active');
        modal.querySelector('#auth-tab-register')?.classList.remove('active');
        return;
    }
    if (target.id === 'auth-tab-register') {
        const container = modal.querySelector('#auth-form-container');
        if (container)
            container.innerHTML = registerFormHtml();
        modal.querySelector('#auth-tab-register')?.classList.add('active');
        modal.querySelector('#auth-tab-login')?.classList.remove('active');
        return;
    }
    if (!currentRestaurant)
        return;
    const menuContent = modal.querySelector('#menu-content');
    const tabDaily = modal.querySelector('#tab-daily');
    const tabWeekly = modal.querySelector('#tab-weekly');
    // Viikon ruokalistan näyttäminen
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
    // Päivän ruokalistan näyttäminen
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
    //Suosikin lisääminen
    if (target.id === 'add-favorite-btn') {
        if (!currentUser) {
            modal.innerHTML = authorizationModal('login');
            return;
        }
        if (!currentRestaurant)
            return;
        const token = localStorage.getItem('token');
        if (!token)
            return;
        try {
            const response = await fetch(apiUrl + '/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    favouriteRestaurant: currentRestaurant._id,
                }),
            });
            const result = await response.json();
            if (response.ok) {
                alert(`${currentRestaurant.name} tallennettu suosikiksi!`);
                currentUser.favouriteRestaurant = currentRestaurant._id;
            }
            else {
                alert('Suosikin tallennus epäonnistui: ' + result.message);
            }
        }
        catch (error) {
            console.error('Virhe suosikkia tallennettaessa:', error);
        }
        return;
    }
});
modal.addEventListener('submit', async (event) => {
    event.preventDefault();
    const target = event.target;
    const errorText = modal.querySelector('#auth-error');
    if (target.id === 'login-form') {
        const usernameInput = target.querySelector('#username');
        const passwordInput = target.querySelector('#password');
        try {
            const loginResult = await login(usernameInput.value, passwordInput.value);
            localStorage.setItem('token', loginResult.token);
            currentUser = loginResult.data;
            updateAuthButton(currentUser);
            modal.close();
            alert(`Tervetuloa takaisin, ${currentUser.username}!`);
        }
        catch (err) {
            if (errorText) {
                errorText.textContent = 'Kirjautuminen epäonnistui. Tarkista tunnukset.';
            }
        }
    }
    if (target.id === 'register-form') {
        const usernameInput = target.querySelector('#reg-username');
        const emailInput = target.querySelector('#reg-email');
        const passwordInput = target.querySelector('#reg-password');
        try {
            await register({
                username: usernameInput.value,
                email: emailInput.value,
                password: passwordInput.value,
            });
            // Automaattinen kirjautuminen rekisteröitymisen jälkeen
            const loginResult = await login(usernameInput.value, passwordInput.value);
            localStorage.setItem('token', loginResult.token);
            currentUser = loginResult.data;
            updateAuthButton(currentUser);
            modal.close();
            alert('Rekisteröityminen onnistui! Olet nyt kirjautunut sisään.');
        }
        catch (err) {
            if (errorText) {
                errorText.textContent = 'Rekisteröityminen epäonnistui.';
            }
        }
    }
});
// Geolocation ja ravintolalistaus
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
        allRestaurants = restaurants;
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
        const favoriteBtn = document.querySelector('#filter-favorite-btn');
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
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => {
                if (!currentUser) {
                    modal.innerHTML = authorizationModal('login');
                    modal.showModal();
                    return;
                }
                const favRestaurant = allRestaurants.filter((r) => r._id === currentUser?.favouriteRestaurant);
                if (favRestaurant.length === 0) {
                    alert('Suosikkiravintolaasi ei löytynyt listalta.');
                    return;
                }
                createTable(favRestaurant);
            });
        }
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
