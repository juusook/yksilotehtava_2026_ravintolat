import {
  dailyMenuTable,
  errorModal,
  restaurantModal,
  restaurantRow,
  weeklyMenuTable,
} from './components';
import {fetchData} from './functions';
import {Menu} from './types/Menu';
import {Restaurant} from './types/Restaurant';
import {apiUrl, positionOptions} from './variables';

const modal = document.querySelector('dialog');
if (!modal) {
  throw new Error('Modal not found');
}

// Muuttuha auki olevalle ravintolle
let currentRestaurant: Restaurant | null = null;

// Tapahtumakuuntelija modaalin napeille (sulkeminen/välilehdet)
modal.addEventListener('click', async (event) => {
  const target = event.target as HTMLElement;

  if (target.classList.contains('close-btn')) {
    modal.close();
    return;
  }

  if (!currentRestaurant) return;

  const menuContent = modal.querySelector('#menu-content');
  const tabDaily = modal.querySelector('#tab-daily');
  const tabWeekly = modal.querySelector('#tab-weekly');


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
});

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
