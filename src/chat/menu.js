const menuItems = {
  2: { name: "Fried Rice with chicken", price: 3500 },
  3: { name: "Fried Rice with beef", price: 4000 },
  4: { name: "Chicken and Chips", price: 5000 },
  5: { name: "Water", price: 300 },
  6: { name: "Soda", price: 500 },
  7: { name: "Egusi Soup with pounded yam", price: 2000 },
  8: { name: "Nkwobi", price: 2000 },
  9: { name: "Pepper Soup", price: 3000 },
  10: { name: "Jollof Rice", price: 4000 }
};

// Function to get a menu item by ID
function getMenuItem(id) {
  return menuItems[id];
}


function getAllMenuItems() {
  return menuItems;
}

module.exports = { 
  getMenuItem, 
  getAllMenuItems 
};
