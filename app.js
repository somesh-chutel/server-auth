const express = require("express");
const {open} = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors')

const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT || 9001;

const dbPath = path.join(__dirname,"goodreads.db");

let db = null;

const initializeServerAndDb = async (req,res)=>{
  try {
    db = await open({
      filename : dbPath,
      driver : sqlite3.Database
    })
    app.listen(port,()=>{
      console.log(`Server started at port ${port}`)
    })
  } catch (error) {
    console.log(error.message);
    process.exit(1)
  }
}

initializeServerAndDb();

app.post("/register/", async (request, response) => {
    const { username, name, password, gender, location } = request.body;
    console.log(request.body);
    const hashedPassword = await bcrypt.hash(request.body.password, 10);
    const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
      const createUserQuery = `
        INSERT INTO 
          user (username, name, password, gender, location) 
        VALUES 
          (
            '${username}', 
            '${name}',
            '${hashedPassword}', 
            '${gender}',
            '${location}'
          )`;
      await db.run(createUserQuery);
      response.send({success:"Login Success"});
    } else {
      response.status(400);
      response.send({error_msg:"User already exists"});
    }
  });

  app.post("/login", async (request, response) => {
    const { username, password } = request.body;
    const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
      response.status(400);
      response.send({error_msg:"Invalid User"});
    } else {
      const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
      if (isPasswordMatched === true) {
        const payload = {
          username: username,
        };
        const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
        response.send({ jwtToken });
      } else {
        response.status(400);
        response.send({error_msg:"Invalid Password"});
      }
    }
  });
  