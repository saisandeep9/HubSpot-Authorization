const express = require("express");
const app = express();
const session = require("express-session");
const axios = require("axios");
const querystring = require("querystring");

app.set("view engine", "pug");

// const config = require("config");

const CLIENT_ID = "86875988-d9fd-46f6-8ba6-ec33dcc79aba";
const REDIRECT_URI = "http://localhost:9000/oauth-callback";
const SCOPES = "contacts";

const authUrl =
  "https://app.hubspot.com/oauth/authorize?client_id=86875988-d9fd-46f6-8ba6-ec33dcc79aba&redirect_uri=http://localhost:9000/oauth-callback&scope=contactshttps://app.hubspot.com/oauth/authorize?client_id=86875988-d9fd-46f6-8ba6-ec33dcc79aba&redirect_uri=http://localhost:9000/oauth-callback&scope=contacts";
// const authUrl =
//   "https://app.hubspot.com/oauth/authorize" +
//   `?client_id=${encodeURIComponent(CLIENT_ID)}` +
//   `&scope=${encodeURIComponent(SCOPES)}` +
//   `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

// // Redirect the user
// app.get("/", function(req, res, next) {

//   return res.redirect(authUrl);
//
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
    res.render("home", {
      token: accessToken,
      contacts: data.contacts
    });

    // res.json(data);
  } else {
    res.render("home", { authUrl });
  }
});

app.get("/oauth-callback", async (req, res) => {
  // Handle the received code

  if (req.query.code) {
    const authCodeProof = {
      grant_type: "authorization_code",
      client_id: "86875988-d9fd-46f6-8ba6-ec33dcc79aba",
      client_secret: "8ac3c44b-7709-448b-bba8-2ec8fe59445d",
      redirect_uri: "http://localhost:9000/oauth-callback",
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
