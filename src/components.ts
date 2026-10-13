import {Menu} from './types/Menu';
import {Restaurant} from './types/Restaurant';

const restaurantRow = (restaurant: Restaurant) => {
  const {name, address, company} = restaurant;
  const tr = document.createElement('tr');

  const companyClass = company.toLowerCase().includes('sodexo') ? 'sodexo' : 'compass';

  const nameCell = document.createElement('td');
  nameCell.innerHTML = `
    ${name}
    <span class="badge ${companyClass}">${company}</span>`;


  const addressCell = document.createElement('td');
  addressCell.innerText = address;

  tr.appendChild(nameCell);
  tr.appendChild(addressCell);
  return tr;
};

const restaurantModal = (restaurant: Restaurant, menu: Menu) => {
  const {name, address, city, postalCode, phone, company} = restaurant;
  let html = `
    <button class="close-btn" type="button">&times;</button>
    <h3>${name}</h3>
    <p>${company}</p>
    <p>${address} ${postalCode} ${city}</p>
    <p>${phone}</p>
    <table>
      <tr>
        <th>Course</th>
        <th>Diet</th>
        <th>Price</th>
      </tr>
    `;
  menu.courses.forEach((course) => {
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

const errorModal = (message: string) => {
  const html = `
        <button class="close-btn" type="button">&times;</button>
        <h3>Error</h3>
        <p>${message}</p>
        `;
  return html;
};

export {restaurantRow, restaurantModal, errorModal};
