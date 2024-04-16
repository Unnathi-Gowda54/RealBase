const express = require("express");
const hbs = require('hbs');
const app = express();
const path = require("path");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser'); 

const connection = require("../src/database/database");
const static_path = path.join(__dirname, "../views");

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set("view engine", "hbs");

app.use(express.static(static_path));
app.use(cookieParser()); 

const port = process.env.port || 3007;

app.get("/", (req, res) => { 
    res.render("index");
});

hbs.registerHelper('firstChar', function(str) {
  return str ? str.charAt(0) : ''; 
});

app.post('/', (req, res) => {
  const { EmailID, Password } = req.body;
  console.log('EmailID:', EmailID); 
  console.log('Password:', Password); 
  const query = 'SELECT * FROM users WHERE EmailID = ?';

  connection.query(query, [EmailID], (err, results) => {
      if (err) {
          console.error('Database error:', err);
          return res.status(500).send({ message: 'Database error' });
      }

      if (results.length > 0) {
          const user = results[0];
          bcrypt.compare(Password, user.Password, (error, response) => {
              if (error) {
                  console.error('Bcrypt error:', error);
                  return res.status(500).send({ message: 'Bcrypt error' });
              }
              if (response) {
                  const id = user.id;
                  const token = jwt.sign({ id , Name: user.Name}, "jwtSecret", { expiresIn: '365d' });
                  res.cookie('token', token, { httpOnly: true });
                  res.redirect('/console');
              } else {
                  res.send({ message: "Wrong username/password combination!" });
              }
          });
      } else {
          res.render('index', { invalidCredentials: true });
      }
  });
});

function verifyToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

  jwt.verify(token, 'jwtSecret', function (err, decoded) {
      if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

      req.userId = decoded.id;
      next();
  });
}

function retrieveID(req, res, next){
    const token = req.cookies.token;

    const decoded = jwt.decode(token);
    req.ID = decoded.id;
    next();
}

app.get("/about", (req, res) => { 
    res.render("about");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  try {
      const { id, Name, EmailID, Password } = req.body;
      const hashedPassword = await bcrypt.hash(Password, 10);
      const query = 'INSERT INTO users (id, Name, EmailID, Password) VALUES (?, ?, ?, ?)';

      connection.query(query, [id, Name, EmailID, hashedPassword], (err, results) => {
          if (err) {
              console.error('Database error:', err);
              return res.status(500).send({ message: 'Database error' });
          }
          console.log("User registered successfully");
          res.redirect('/');
      });
  } catch (error) {
      console.error('Error:', error);
      res.status(400).send(error);
  }
});

app.get("/console", verifyToken, retrieveID, (req, res) => {
    const token = req.cookies.token;
    const decoded = jwt.decode(token);
    const Name = decoded.Name;
    res.render("console", { Name: Name });
});

app.post("/console", retrieveID, (req, res) => {
    const currentID = req.ID;
    console.log(`ID: ${req.ID}` );

    const {nameInput, CN, TP} = req.body;
    console.log(req.body);

    if (!Array.isArray(CN) || !Array.isArray(TP) || CN.length !== TP.length) {
        return res.status(400).send({ message: 'Invalid input data' });
    }

    let columnDefs = "";
    for (let i = 0; i < CN.length; i++) {
        columnDefs += `${CN[i]} ${TP[i]}, `;
    }
    columnDefs = columnDefs.slice(0, -2);

    const query = `CREATE TABLE ${nameInput} (${columnDefs});`;
    console.log(query);
    console.log(connection.query);
    connection.query(query, (err, results) =>  {
        if (err) {
            console.error('Could not create table', err);
            return res.status(500).send({ message: 'Could not create table' });
        }
        console.log("Table created successfully");
    });

    const newTableQuery =  `INSERT INTO id_tables values('${currentID}', '${nameInput}');`;
    console.log(`Inserted your ${currentID}, ${nameInput} into our database`);

    connection.query(newTableQuery, (err, results) => {
        if (err) {
            return res.status(500);
        }
        res.redirect("/views");
    });
    
});

app.get("/views", retrieveID, (req, res) => {
    const currentID = req.ID;
    const token = req.cookies.token;
    const decoded = jwt.decode(token);
    const Name = decoded.Name;
    
    const newQuery = `SELECT \`Table Name\` FROM id_tables where ID = ${currentID} `; 
    connection.query(newQuery, (err, results) => {
        if (err) {
            console.error('Error fetching data from database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        const tableNames = results.map(result => result['Table Name']);
        res.render('views', { tableNames, Name: Name });
    });
}); 

app.post("/views", (req, res) => {
    const currentTable = req.body.currentTable;

    const columnQuery = `SHOW COLUMNS FROM ${currentTable}`;

    connection.query(columnQuery, (err, columns) => {
        if (err) {
            console.error('Error fetching columns from table:', err);
            res.status(500).send('Error fetching columns from table');
            return;
        }

        const dataQuery = `SELECT * FROM ${currentTable}`;

        connection.query(dataQuery, (err, tableData) => {
            if (err) {
                console.error('Error fetching data from table:', err);
                res.status(500).send('Error fetching data from table');
                return;
            }
            res.render('display', { selectedTable: currentTable, columns: columns, tableData: tableData });
        });
    });
});

app.get("/display", (req, res) => {
    const currentTable = req.query.currentTable;    

    const dataQuery = `SELECT * FROM ${currentTable}`;

    connection.query(dataQuery, (err, tableData) => {
        if (err) {
            console.error('Error fetching data from table:', err);
            res.status(500).send('Error fetching data from table');
            return;
        }
        
        res.render("display", { selectedTable: currentTable, columns: [], tableData: tableData }); 
    });
});

app.post("/display", (req, res) => {
    const currentTable = req.body.currentTable;
    console.log(currentTable);
    const values = Object.values(req.body);
    const columns = Object.keys(req.body);

    // Prepare the SQL INSERT query
    const indexToRemove = columns.indexOf('currentTable');
    if (indexToRemove > -1) {
        columns.splice(indexToRemove, 1);
        values.splice(indexToRemove, 1);
    }

    const insertQuery = `INSERT INTO ${currentTable} VALUES (${values.map(value => `'${value}'`).join(', ')});`;
    console.log("Insert Query:", insertQuery);

    // Execute the INSERT query
    connection.query(insertQuery, (err, result) => {
        if (err) {
            console.error('Error inserting values into table:', err);
            res.status(500).send('Error inserting values into table');
            return;
        }
        console.log("Values inserted successfully");
        res.redirect("/views"); // Redirect back to the display page
    });
});

app.post("/getTableData", (req, res) => {
    const currentTable = req.body.currentTable;

    const dataQuery = `SELECT * FROM ${currentTable}`;

    connection.query(dataQuery, (err, tableData) => {
        if (err) {
            console.error('Error fetching data from table:', err);
            res.status(500).json({ error: 'Error fetching data from table' });
            return;
        }

        res.json(tableData);
    });
});


app.post("/deleteTable", (req, res) => {
    console.log("entered");
    const currentTable = req.body.currentTable;

    const deleteQuery = `DELETE FROM id_tables where \`Table Name\` = '${currentTable}';`;
    const dropQuery = `DROP TABLE ${currentTable};`;
    console.log(deleteQuery);

    connection.query(dropQuery, (err, dropResult) => {
        if (err) {
            console.error('Error dropping table:', err);
            res.status(500).send('Error dropping table');
            return;
        }

        connection.query(deleteQuery, (deleteErr, deleteResult) => {
            if (deleteErr) {
                console.error('Error deleting table entry:', deleteErr);
                res.status(500).send('Error deleting table entry');
                return;
            }
            console.log("Table dropped successfully");
            res.redirect("/views");
        });
    });
});

app.listen(port, () => {
    console.log(`server is running at port number ${port}`);
});
