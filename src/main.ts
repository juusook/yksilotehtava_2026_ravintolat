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

// Muuttuha auki olevalle ravintolle
let currentUser: User | null = null;
let currentRestaurant: Restaurant | null = null;
let allRestaurants: Restaurant[] = [];

// Kirjautuminen ja rekisteröityminen
const loginBtn = document.querySelector('#login-btn') as HTMLButtonElement | null;
const registerBtn = document.querySelector('#register-btn') as HTMLButtonElement | null;


const updateAuthButton = (user: User | null) => {
  if (loginBtn) {
    if (user) {
      loginBtn.textContent = `Kirjaudu ulos (${user.username})`;
    } else {
      loginBtn.textContent = 'Kirjaudu';
    }
  }

  if (registerBtn) {
    if (user) {
      registerBtn.style.display = 'none';
    } else {
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

// Kirjaudu ja kirjaudu ulos -kuuntelija
if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    if (currentUser) {
      // Kirjaudutaan ulos
      localStorage.removeItem('token');
      currentUser = null;
      updateAuthButton(null);
      alert('Olet kirjautunut ulos.');
    } else {
      // Avataan kirjautumis- ja rekisteröitymismodaali
      modal.innerHTML = authorizationModal('login');
      modal.showModal();
    }
  });
}


// Tapahtumakuuntelija modaalin napeille (sulkeminen/välilehdet)
modal.addEventListener('click', async (event) => {
  const target = event.target as HTMLElement;

  // Modaalin sulkeminen
  if (target.classList.contains('close-btn')) {
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

  if (!currentRestaurant) return;

  const menuContent = modal.querySelector('#menu-content');
  const tabDaily = modal.querySelector('#tab-daily');
  const tabWeekly = modal.querySelector('#tab-weekly');

  // Viikon ruokalistan näyttäminen
  if (target.id === 'tab-weekly') {
    try {
      if (menuContent) {
        menuContent.innerHTML = '<p>Ladataan viikon ruokalistaa...</p>';
      }

      const weeklyData = await fetchData<any>(
        apiUrl + `/restaurants/weekly/${currentRestaurant._id}/fi`
      );

      const days = weeklyData.days || (Array.isArray(weeklyData) ? weeklyData : []);

      if (menuContent) {
        menuContent.innerHTML = weeklyMenuTable(days);
      }

      tabDaily?.classList.remove('active');
      tabWeekly?.classList.add('active');
    } catch (error) {
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

      const dailyData = await fetchData<Menu>(
        apiUrl + `/restaurants/daily/${currentRestaurant._id}/fi`
      );

      if (menuContent) {
        menuContent.innerHTML = dailyMenuTable(dailyData?.courses);
      }

      tabWeekly?.classList.remove('active');
      tabDaily?.classList.add('active');
    } catch (error) {
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
        body: JSON.stringify({
          favouriteRestaurant: currentRestaurant._id,
        }),
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
    return;
  }
});

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
      alert(`Tervetuloa takaisin, ${currentUser.username}!`);
    } catch (err) {
      if (errorText) {
        errorText.textContent = 'Kirjautuminen epäonnistui. Tarkista tunnukset.';
      }
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

      // Automaattinen kirjautuminen rekisteröitymisen jälkeen
      const loginResult = await login(usernameInput.value, passwordInput.value);
      localStorage.setItem('token', loginResult.token);
      currentUser = loginResult.data;
      updateAuthButton(currentUser);
      modal.close();
      alert('Rekisteröityminen onnistui! Olet nyt kirjautunut sisään.');
    } catch (err) {
      if (errorText) {
        errorText.textContent = 'Rekisteröityminen epäonnistui.';
      }
    }
  }
});

// Geolocation ja ravintolalistaus
const calculateDistance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

const createTable = (restaurants: Restaurant[]) => {
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
        const menu = await fetchData<Menu>(
          apiUrl + `/restaurants/daily/${restaurant._id}/fi`
        );

        // Luodaan ruokalistan HTML ja asetetaan se modaaliin
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
      const sodexoRestaurants = restaurants.filter(
        (restaurant: Restaurant) => restaurant.company === 'Sodexo'
      );
      createTable(sodexoRestaurants);
    });

    if (!compassBtn) {
      throw new Error('Compass button not found');
    }

    compassBtn.addEventListener('click', () => {
      const compassRestaurants = restaurants.filter(
        (restaurant: Restaurant) => restaurant.company === 'Compass Group'
      );
      createTable(compassRestaurants);
    });

    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', () => {
        if (!currentUser) {
          modal.innerHTML = authorizationModal('login');
          modal.showModal();
          return;
        }

        const favRestaurant = allRestaurants.filter(
          (r) => r._id === currentUser?.favouriteRestaurant
        );

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
  } catch (error) {
    modal.innerHTML = errorModal((error as Error).message);
    modal.showModal();
  }
};

navigator.geolocation.getCurrentPosition(success, error, positionOptions);
