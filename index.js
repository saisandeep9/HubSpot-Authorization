const express = require("express");
const app = express();
const session = require("express-session");
const axios = require("axios");
const querystring = require("querystring");

let http = require("http");
let fs = require("fs");
// fs.readFile("./home1.html");

var cors = require("cors");

app.use(cors());
app.set("view engine", "pug");

const config = require("config");

const authUrl =
  "https://app.hubspot.com/oauth/authorize" +
  `?client_id=${encodeURIComponent(config.get(`app.client_id`))}` +
  `&scope=${encodeURIComponent(config.get(`app.scopes`))}` +
  `&redirect_uri=${encodeURIComponent(config.get(`app.redirect_uri`))}`;

// app.get("/", function(req, res, next) {
//   return res.redirect(authUrl);
// });

const token = {};

app.use(
  session({
    secret: Math.random()
      .toString(36)
      .substring(2),
    resave: false,
    saveUninitialized: true
  })
);

const auth = userId => {
  return token[userId] ? true : false;
};

app.get("/", async (req, res) => {
  if (auth(req.sessionID)) {
    const accessToken = token[req.sessionID];
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    };
    const contacts =
      "https://api.hubapi.com/contacts/v1/lists/all/contacts/all";
    const resp = await axios.get(contacts, { headers });
    const data = resp.data;
    // res.render("home", {
    //   token: accessToken,
    //   contacts: data.contacts
    // });

    // res.send({
    //   token: accessToken,
    //   contacts: data.contacts
    // });

    res.send(headers);
    // res.redirect("http://localhost:3000");

    // res.json(data);
  } else {
    // Redirect the user
    // res.render("home", { authUrl });
    res.send({ authUrl });
    // console.log("1");
  }
});

app.get("/oauth-callback", async (req, res) => {
  // Handle the received code

  if (req.query.code) {
    const authCodeProof = {
      grant_type: "authorization_code",
      client_id: config.get(`app.client_id`),
      client_secret: config.get(`app.client_secret`),
      redirect_uri: config.get(`app.redirect_uri`),
      code: req.query.code
    };
    try {
      const responseBody = await axios.post(
        "https://api.hubapi.com/oauth/v1/token",
        querystring.stringify(authCodeProof)
      );
      token[req.sessionID] = responseBody.data.access_token;
      // res.json(responseBody.data.access_token);
      res.redirect("/");
    } catch (e) {
      console.error(e);
    }
  }
});

const port = process.env.ECBPORT || 9000;
const server = app.listen(port, () =>
  console.log(`lisenting on port ${port}..`)
);

module.exports = server;
