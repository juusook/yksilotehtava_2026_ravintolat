import {
  dailyMenuTable,
  errorModal,
  restaurantModal,
  restaurantRow,
  weeklyMenuTable,
  authorizationModal,
  loginFormHtml,
  registerFormHtml,
} from './components';
import {fetchData} from './functions';
import {Menu} from './types/Menu';
import {Restaurant} from './types/Restaurant';
import {apiUrl, positionOptions} from './variables';
import {login, register, getUserData} from './authorization';
import type {User} from './interfaces/Users';

const modal = document.querySelector('dialog');
if (!modal) {
  throw new Error('Modal not found');
}

let currentUser: User | null = null;
let currentRestaurant: Restaurant | null = null;
let allRestaurants: Restaurant[] = [];

const loginBtn = document.querySelector('#login-btn') as HTMLButtonElement | null;
const registerBtn = document.querySelector('#register-btn') as HTMLButtonElement | null;

const updateAuthButton = (user: User | null) => {
  if (loginBtn) {
    loginBtn.textContent = user ? user.username : 'Kirjaudu';
  }

  if (registerBtn) {
    registerBtn.style.display = user ? 'none' : '';
  }
};

if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    if (currentUser) {
      modal.innerHTML = authorizationModal('profile', currentUser);
      modal.showModal();
    } else {
      modal.innerHTML = authorizationModal('login');
      modal.showModal();
    }
  });
}

if (registerBtn) {
  registerBtn.addEventListener('click', () => {
    if (!currentUser) {
      modal.innerHTML = authorizationModal('register');
      modal.showModal();
    }
  });
}

// LocalStorage tarkistus
const checkToken = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    currentUser = await getUserData(token);
    updateAuthButton(currentUser);
  } catch (error) {
    console.warn('Token ei ole voimassa:', error);
    localStorage.removeItem('token');
    currentUser = null;
    updateAuthButton(null);
  }
};

checkToken();

// Tapahtumakuuntelija modaalin napeille
modal.addEventListener('click', async (event) => {
  const target = event.target as HTMLElement;

  if (target.closest('.close-btn')) {
    modal.close();
    return;
  }

  if (target.id === 'auth-tab-login') {
    const container = modal.querySelector('#auth-form-container');
    if (container) container.innerHTML = loginFormHtml();
    modal.querySelector('#auth-tab-login')?.classList.add('active');
    modal.querySelector('#auth-tab-register')?.classList.remove('active');
    return;
  }

  if (target.id === 'auth-tab-register') {
    const container = modal.querySelector('#auth-form-container');
    if (container) container.innerHTML = registerFormHtml();
    modal.querySelector('#auth-tab-register')?.classList.add('active');
    modal.querySelector('#auth-tab-login')?.classList.remove('active');
    return;
  }

  if (target.id === 'logout-btn') {
    localStorage.removeItem('token');
    currentUser = null;
    updateAuthButton(null);
    modal.close();
    return;
  }

  if (!currentRestaurant) return;

  const menuContent = modal.querySelector('#menu-content');
  const tabDaily = modal.querySelector('#tab-daily');
  const tabWeekly = modal.querySelector('#tab-weekly');

  if (target.id === 'tab-weekly') {
    try {
      if (menuContent) menuContent.innerHTML = '<p>Ladataan viikon ruokalistaa...</p>';
      const weeklyData = await fetchData<any>(apiUrl + `/restaurants/weekly/${currentRestaurant._id}/fi`);
      const days = weeklyData.days || (Array.isArray(weeklyData) ? weeklyData : []);
      if (menuContent) menuContent.innerHTML = weeklyMenuTable(days);
      tabDaily?.classList.remove('active');
      tabWeekly?.classList.add('active');
    } catch (error) {
      if (menuContent) menuContent.innerHTML = '<p>Viikon ruokalistaa ei saatu haettua.</p>';
    }
  }

  if (target.id === 'tab-daily') {
    try {
      if (menuContent) menuContent.innerHTML = '<p>Ladataan päivän ruokalistaa...</p>';
      const dailyData = await fetchData<Menu>(apiUrl + `/restaurants/daily/${currentRestaurant._id}/fi`);
      if (menuContent) menuContent.innerHTML = dailyMenuTable(dailyData?.courses);
      tabWeekly?.classList.remove('active');
      tabDaily?.classList.add('active');
    } catch (error) {
      if (menuContent) menuContent.innerHTML = '<p>Päivän ruokalistaa ei saatu haettua.</p>';
    }
  }

  if (target.id === 'add-favorite-btn') {
    if (!currentUser) {
      modal.innerHTML = authorizationModal('login');
      return;
    }
    if (!currentRestaurant) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(apiUrl + '/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ favouriteRestaurant: currentRestaurant._id }),
      });
      const result = await response.json();
      if (response.ok) {
        alert(`${currentRestaurant.name} tallennettu suosikiksi!`);
        currentUser.favouriteRestaurant = currentRestaurant._id;
      } else {
        alert('Suosikin tallennus epäonnistui: ' + result.message);
      }
    } catch (error) {
      console.error('Virhe suosikkia tallennettaessa:', error);
    }
  }
});

// Lomakkeiden lähetys
modal.addEventListener('submit', async (event) => {
  event.preventDefault();
  const target = event.target as HTMLFormElement;
  const errorText = modal.querySelector('#auth-error');

  if (target.id === 'login-form') {
    const usernameInput = target.querySelector('#username') as HTMLInputElement;
    const passwordInput = target.querySelector('#password') as HTMLInputElement;

    try {
      const loginResult = await login(usernameInput.value, passwordInput.value);
      localStorage.setItem('token', loginResult.token);
      currentUser = loginResult.data;
      updateAuthButton(currentUser);
      modal.close();
    } catch (err) {
      if (errorText) errorText.textContent = 'Kirjautuminen epäonnistui. Tarkista tunnukset.';
    }
  }

  if (target.id === 'register-form') {
    const usernameInput = target.querySelector('#reg-username') as HTMLInputElement;
    const emailInput = target.querySelector('#reg-email') as HTMLInputElement;
    const passwordInput = target.querySelector('#reg-password') as HTMLInputElement;

    try {
      await register({
        username: usernameInput.value,
        email: emailInput.value,
        password: passwordInput.value,
      });

      const loginResult = await login(usernameInput.value, passwordInput.value);
      localStorage.setItem('token', loginResult.token);
      currentUser = loginResult.data;
      updateAuthButton(currentUser);
      modal.close();
      alert('Rekisteröityminen onnistui!');
    } catch (err) {
      if (errorText) errorText.textContent = 'Rekisteröityminen epäonnistui.';
    }
  }

  if (target.id === 'profile-form') {
    const usernameInput = target.querySelector('#prof-username') as HTMLInputElement;
    const emailInput = target.querySelector('#prof-email') as HTMLInputElement;
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(apiUrl + '/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: usernameInput.value,
          email: emailInput.value,
        }),
      });

      if (response.ok) {
        if (currentUser) {
          currentUser.username = usernameInput.value;
          currentUser.email = emailInput.value;
        }
        updateAuthButton(currentUser);
        modal.close();
        alert('Tiedot päivitetty onnistuneesti!');
      } else {
        if (errorText) errorText.textContent = 'Tietojen päivitys epäonnistui.';
      }
    } catch (err) {
      console.error('Virhe profiilia päivitettäessä:', err);
    }
  }
});

// Taulukot ja Geolocation
const calculateDistance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

const createTable = (restaurants: Restaurant[]) => {
  const tbody = document.querySelector('tbody');
  if (!tbody) throw new Error('Table body not found');

  tbody.innerHTML = '';

  restaurants.forEach((restaurant, index) => {
    const isNearest = index === 0;
    const tr = restaurantRow(restaurant, isNearest);
    tbody.appendChild(tr);

    tr.addEventListener('click', async () => {
      try {
        currentRestaurant = restaurant;
        document.querySelectorAll('.highlight').forEach((high) => high.classList.remove('highlight'));
        tr.classList.add('highlight');

        const menu = await fetchData<Menu>(apiUrl + `/restaurants/daily/${restaurant._id}/fi`);
        const menuHtml = dailyMenuTable(menu?.courses);
        modal.innerHTML = restaurantModal(restaurant, menuHtml, 'daily');
        modal.showModal();
      } catch (error) {
        modal.innerHTML = errorModal((error as Error).message);
        modal.showModal();
      }
    });
  });
};

const error = (err: GeolocationPositionError) => {
  console.warn(`ERROR(${err.code}): ${err.message}`);
};

const success = async (pos: GeolocationPosition) => {
  try {
    const crd = pos.coords;
    const restaurants = await fetchData<Restaurant[]>(apiUrl + '/restaurants');
    allRestaurants = restaurants;

    restaurants.sort((a, b) => {
      const distanceA = calculateDistance(crd.latitude, crd.longitude, a.location.coordinates[1], a.location.coordinates[0]);
      const distanceB = calculateDistance(crd.latitude, crd.longitude, b.location.coordinates[1], b.location.coordinates[0]);
      return distanceA - distanceB;
    });

    createTable(restaurants);

    const sodexoBtn = document.querySelector('#sodexo');
    const compassBtn = document.querySelector('#compass');
    const resetBtn = document.querySelector('#reset');
    const favoriteBtn = document.querySelector('#filter-favorite-btn');

    if (sodexoBtn) {
      sodexoBtn.addEventListener('click', () => {
        createTable(restaurants.filter((r) => r.company === 'Sodexo'));
      });
    }

    if (compassBtn) {
      compassBtn.addEventListener('click', () => {
        createTable(restaurants.filter((r) => r.company === 'Compass Group'));
      });
    }

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

    if (resetBtn) {
      resetBtn.addEventListener('click', () => createTable(restaurants));
    }
  } catch (error) {
    modal.innerHTML = errorModal((error as Error).message);
    modal.showModal();
  }
};

navigator.geolocation.getCurrentPosition(success, error, positionOptions);
