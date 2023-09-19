var express = require('express');
const router = express.Router()
router.use(express.json());


/**********************************************
  ACCESS AND AUTHENTICATION 
 ***********************************************/
const auth = require("../middleware/auth.js")

// Middleware function to set currentpage in session
function setCurrentPage(page) {
  return function (req, res, next) {
    req.session.currentpage = page;
    console.log("Inside set: ", req.session)

    next();

  };
}

/**********************************************
 * Database Connection
 * ***********************************************/
const pool = require("../db/dbConnection.js")


/**********************************************
 * Get Secret Credentials
 * ***********************************************/
const getSecretsValues = require("../middleware/getSecrets.js")

var emailUser, emailPw, adminUser, region,accessKeyId,secretAccessKey, UserAccountTableName,emailciphers,emailPort, emailHost = ''

getSecretsValues().then((secretObject) => {
    //get secretObject
    // console.log(secretObject);
    emailUser = secretObject.emailUser
    emailPw = secretObject.emailPw
    adminUser = secretObject.adminUser
    region= secretObject.region
    accessKeyId = secretObject.accessKeyId
    secretAccessKey = secretObject.secretAccessKey
    UserAccountTableName = secretObject.UserAccountTableName
    emailHost = secretObject.emailHost
    emailPort = secretObject.emailPort
    emailciphers = secretObject.emailciphers

  }).catch((error) => {
    // Handle any errors that occurred during retrieval
    console.error('Error retrieving secret credentials:', error);
});



router.get('/', setCurrentPage('/'), auth, (req, res) => {
  console.log("Inside Home")
  req.session.currentpage = '/';
  console.log(req.session)
  user = req.session.userFullName 
  

  res.render("home", {user})
})

// Render to view Inventory
router.get('/viewInventory', setCurrentPage('/inventory'), auth,(req, res) => {
  console.log("Inside Inventory")
  req.session.currentpage = '/inventory';
  console.log(req.session)
  user = req.session.userFullName
  

  res.render("viewInventory", {user})
})

router.get('/editInventory', setCurrentPage('/inventory'), auth, (req, res) => {
  console.log("Inside Inventory")
  req.session.currentpage = '/inventory';
  console.log(req.session)
  user = req.session.userFullName || "Nana G"
  

  res.render("editInventory", {user})
})



router.post("/inventory", async (req, res) => {
  const filter = req.body; // Get the filter criteria from the client

  let query = 'SELECT * FROM geblife.inventory WHERE 1=1'; // Initial query

  const values = []; // Array to store parameterized values

  // Build the SQL query dynamically based on the filter criteria
  if (filter.name) {
    query += ' AND name LIKE $1';
    values.push(`%${filter.name}%`);
  }

  if (filter.category) {
    query += ' AND category LIKE $2';
    values.push(`%${filter.category}%`);
  }

  if (filter.color) {
    query += ' AND color LIKE $3';
    values.push(`%${filter.color}%`);
  }

  if (filter.size) {
    query += ' AND size LIKE $4';
    values.push(`%${filter.size}%`);
  }

  if (filter.total_quantity) {
    query += ' AND total_quantity >= $5';
    values.push(filter.total_quantity);
  }

  if (filter.available_quantity) {
    query += ' AND available_quantity >= $6';
    values.push(filter.available_quantity);
  }

  console.log("Query: ", query)
  try {
    const client = await pool.connect();
    const result = await client.query(query, values);
    client.release();

    const inventoryItems = result.rows;
    console.log("Filtered inventory items:");
    console.log(inventoryItems);
    res.json(inventoryItems);
  } catch (error) {
    console.error('Error retrieving filtered inventory items:', error);
    res.status(500).json({ success: false, error: `Error retrieving filtered inventory items: ${error}` });
  }
});


router.post("/viewInventory", async (req, res) => {

  let query = 'SELECT name as "Name", category as "Category", color as "Color", size as "Size", total_quantity as "Total Quantity", available_quantity as "Available Quantity" FROM geblife.inventory'; // Initial query

  console.log("Query: ", query)
  try {
    const client = await pool.connect();
    const result = await client.query(query);
    client.release();

    const inventoryItems = result.rows;
    console.log("Filtered inventory items:");
    console.log(inventoryItems);
    res.json(inventoryItems);
  } catch (error) {
    console.error('Error retrieving filtered inventory items:', error);
    res.status(500).json({ success: false, error: `Error retrieving filtered inventory items: ${error}` });
  }
});




// Insert an item into the inventory
router.post('/insertItem', async (req, res) => {
  console.log('Received POST request to /insertItem');
  const newItem = req.body;
  console.log(newItem)

  try {
    const result = await pool.query(
      'INSERT INTO geblife.inventory (name, category, color, size, total_quantity, available_quantity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [newItem.name, newItem.category, newItem.color, newItem.size, newItem.total_quantity, newItem.available_quantity]
    );

    
    res.json({ success: true, message: `(${newItem.name}, ${newItem.category}, ${newItem.color}, ${newItem.size}) Item inserted successfully`, insertedItemId: result.rows[0].id });
  } catch (error) {
    console.error('Error inserting item:', error);
    res.status(500).json({ success: false, error: `Error inserting item: ${error}`});
  }
});

// Update an item in the inventory
router.post('/updateItem', async (req, res) => {
  const updatedItem = req.body;

  console.log(updatedItem)

  try {
    await pool.query(
      'UPDATE geblife.inventory SET name = $1, category = $2, color =$3, size =$4, total_quantity=$5, available_quantity=$6 WHERE id = $7',
      [updatedItem.name, updatedItem.category, updatedItem.color, updatedItem.size, updatedItem.total_quantity, updatedItem.available_quantity, updatedItem.id]
    );

    res.json({ success: true, message: `(${updatedItem.name}: ${updatedItem.category} : ${updatedItem.color}, ${updatedItem.size}) Item updated successfully` });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ success: false, error: `Error updating item: ${error}` });
  }
});

// Delete an item from the inventory
router.post('/deleteItem', async (req, res) => {
  const itemId = req.body.id;

  try {
    await pool.query('DELETE FROM geblife.inventory WHERE id = $1', [itemId]);
    res.json({ success: true, message: `Item ${itemId} deleted successfully` });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ success: false, error: `Error deleting item: ${error}` });
  }
});

router.post('/validateAndInsert', async (req, res) => {
  try {
    const scannedData = req.body;

    console.log(scannedData);

    // Check if the scanned data already exists in the database
    const existingQuery = {
      text: 'SELECT * FROM geblife.inventory WHERE name = $1 AND category = $2 AND color = $3 AND size= $4',
      values: [scannedData.name, scannedData.category,scannedData.color,scannedData.size ],
    };

    const existingItem = await pool.query(existingQuery);

    if (existingItem.rows.length > 0) {
      // Data already exists, increment the available quantity
      const existingItemId = existingItem.rows[0].id;
      const incrementQuantity = scannedData.total_quantity;
      
      const updateQuery = {
        text: 'UPDATE geblife.inventory SET total_quantity = total_quantity + $1 WHERE id = $2',
        values: [incrementQuantity, existingItemId],
      };

      await pool.query(updateQuery);

      return res.status(200).json({ message: `Total Quantity incremented successfully for data: Name: ${scannedData.name}, Category: ${scannedData.category} , Color: ${scannedData.color}, Size: ${scannedData.size}` });
    }

    // Data doesn't exist, insert it into the database
    const insertQuery = {
      text:
        'INSERT INTO geblife.inventory (name, category, color, size, total_quantity, available_quantity) VALUES ($1, $2, $3, $4, $5, $6)',
      values: [
        scannedData.name,
        scannedData.category,
        scannedData.color,
        scannedData.size,
        scannedData.total_quantity,
        scannedData.available_quantity,
      ],
    };

    await pool.query(insertQuery);

    res.status(200).json({ message: `Data inserted successfully. Newly inserted Data: Name: ${scannedData.name}, Category: ${scannedData.category} , Color: ${scannedData.color}, Size: ${scannedData.size}` });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});


















  
module.exports = router