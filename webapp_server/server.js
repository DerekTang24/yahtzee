//..............Include Express..................................//
const express = require("express");
const fs = require("fs");
const ejs = require("ejs");
const fetch = require("node-fetch");

//..............Create an Express server object..................//
const app = express();

//..............Apply Express middleware to the server object....//
app.use(express.json()); //Used to parse JSON bodies (needed for POST requests)
app.use(express.urlencoded());
app.use(express.static("public")); //specify location of static assests
app.set("views", __dirname + "/views"); //specify location of templates
app.set("view engine", "ejs"); //specify templating library

//.............Define server routes..............................//
//Express checks routes in the order in which they are defined
app.get("/", async function (request, response) {
  console.log(request.method, request.url); //event logging

  //-------------------Testing purposes: Verifying users actually exist in DB------------//
  const url = "http://127.0.0.1:5000/users";
  const res = await fetch(url);
  const details = JSON.parse(await res.text());
  console.log("All Users in DB:");
  console.log(details);
  //-----------------------------------//

  response.status(200);
  response.setHeader("Content-Type", "text/html");
  response.render("login", {
    feedback: "",
    username: "",
  });
  return;
});

app.get("/users", async function (request, response) {
  console.log(request.method, request.url); //event logging

  response.status(200);
  response.setHeader("Content-Type", "text/html");
  response.render("user/user_details", {
    feedback: "",
    username: "",
    email: "",
    password: "",
    games: [],
  });
});

app.get("/users/:username", async function (request, response) {
  console.log(request.method, request.url); //event logging
  username = request.params.username;
  // add link
  console.log("users/:username", request.method, request.url, request.params); //event logging
  const games_url = "http://127.0.0.1:5000/users/games/" + username;
  const games_res = await fetch(games_url);
  const games = JSON.parse(await games_res.text());
  console.log("games", games);

  const user_url = "http://127.0.0.1:5000/users/" + username;
  const user_res = await fetch(user_url);
  const user = JSON.parse(await user_res.text());
  console.log("user details", user);

  response.status(200);
  response.setHeader("Content-Type", "text/html");
  response.render("user/user_details", {
    feedback: "",
    username,
    email: user.email,
    password: user.password,
    games: games.map((e) => e.name),
  });
  return;
});

app.get("/users/delete/:username", async function (request, response) {
  console.log(request.method, request.url); //event logging
  const username = request.params.username;
  const games_url = "http://127.0.0.1:5000/users/games/" + username;
  const games_res = await fetch(games_url);
  const games = JSON.parse(await games_res.text());

  console.log("games", games);

  games.forEach(async (e) => {
    const get_scorecard_url =
      "http://127.0.0.1:5000/games/scorecards/" + e.name;
    const get_scorecard_res = await fetch(get_scorecard_url);
    const scorecard = JSON.parse(await get_scorecard_res.text());
    const delete_scorecard_url =
      "http://127.0.0.1:5000/scorecards/" + scorecard[0].id;
    const headers = {
      "Content-Type": "application/json",
    };
    const delete_scorecard_res = await fetch(delete_scorecard_url, {
      method: "DELETE",
      headers,
    });
  });

  const url = "http://127.0.0.1:5000/users/" + username;
  const headers = {
    "Content-Type": "application/json",
  };
  const res = await fetch(url, {
    method: "DELETE",
    headers,
  });

  response.status(200);
  response.setHeader("Content-Type", "text/html");
  response.redirect("/login");
});

app.get("/games/:game_name/:username", async function (request, response) {
  const game_name = request.params.game_name;
  const username = request.params.username;
  // add link
  console.log(
    "games/:game_name/:username",
    request.method,
    request.url,
    request.params
  ); //event logging

  response.status(200);
  response.setHeader("Content-Type", "text/html");
  response.render("game/game", {
    feedback: "",
    username,
    game_name,
  });
});

app.get("/games/:username", async function (request, response) {
  const username = request.params.username;
  const feedback = request.query.feedback;
  // add link
  console.log("games/:username", request.method, request.url, request.params); //event logging
  const games_url = "http://127.0.0.1:5000/users/games/" + username;
  const games_res = await fetch(games_url);
  const games = JSON.parse(await games_res.text());
  console.log("games", games);

  const scores_url = "http://127.0.0.1:5000/scores/" + username;
  const scores_res = await fetch(scores_url);
  const scores = JSON.parse(await scores_res.text());
  console.log("scores", scores);
  response.status(200);
  response.setHeader("Content-Type", "text/html");
  response.render("game/game_details", {
    feedback: feedback === "invalid" ? "invalid name" : "",
    username,
    games: games.map((e) => e.name),
    scores: scores.map((e) => e.score),
  });
});

app.get("/login", async function (request, response) {
  console.log(request.method, request.url); //event logging

  //Get user login info from query string portion of url
  const username = request.query.username;
  const password = request.query.password;
  if (username && password) {
    //get alleged user
    const url = "http://127.0.0.1:5000/users/" + username;
    const res = await fetch(url);
    const details = JSON.parse(await res.text());
    console.log("Requested user per username:");
    console.log(details);

    //Verify user password matches
    if (details["password"] && details["password"] == password) {
      const games_url = "http://127.0.0.1:5000/users/games/" + username;
      const games_res = await fetch(games_url);
      const games = JSON.parse(await games_res.text());
      console.log("games", games);

      const scores_url = "http://127.0.0.1:5000/scores/" + username;
      const scores_res = await fetch(scores_url);
      const scores = JSON.parse(await scores_res.text());
      console.log("scores", scores);
      response.status(200);
      response.setHeader("Content-Type", "text/html");
      response.render("game/game_details", {
        feedback: "",
        username,
        games: games.map((e) => e.name),
        scores: scores.map((e) => e.score),
      });
    } else if (details["password"] && details["password"] != password) {
      response.status(401); //401 Unauthorized
      response.setHeader("Content-Type", "text/html");
      response.render("login", {
        feedback: "Incorrect password. Please try again",
      });
    } else {
      response.status(404); //404 Unauthorized
      response.setHeader("Content-Type", "text/html");
      response.render("login", {
        feedback: "Requested user does not exist",
      });
    }
  } else {
    response.status(401); //401 Unauthorized
    response.setHeader("Content-Type", "text/html");
    response.render("login", {
      feedback: "Please provide both a username and password",
    });
  }
}); //GET /login

app.get(
  "/games/delete/:game_name/:username",
  async function (request, response) {
    console.log(request.method, request.url); //event logging
    const game_name = request.params.game_name;
    const username = request.params.username;

    const games_url = "http://127.0.0.1:5000/games/scorecards/" + game_name;
    const games_res = await fetch(games_url);
    const scorecards = JSON.parse(await games_res.text());

    scorecards
      .map((e) => e.id)
      .forEach(async (card_id) => {
        const scorecard_url = "http://127.0.0.1:5000/scorecards/" + card_id;
        const headers = {
          "Content-Type": "application/json",
        };
        const scorecard_res = await fetch(scorecard_url, {
          method: "DELETE",
          headers,
        });
      });

    const url = "http://127.0.0.1:5000/games/" + game_name;
    const headers = {
      "Content-Type": "application/json",
    };
    const res = await fetch(url, {
      method: "DELETE",
      headers,
    });

    response.status(200);
    response.setHeader("Content-Type", "text/html");
    response.redirect("/games/" + username);
  }
);

app.post("/users", async function (request, response) {
  console.log(request.method, request.url); //event logging

  //Get user information from body of POST request
  const username = request.body.username;
  const email = request.body.email;
  const password = request.body.password;
  // HEADs UP: You really need to validate this information!
  console.log("Info recieved:", username, email, password);
  if (username && email && password) {
    //get alleged user

    const url = "http://127.0.0.1:5000/users";
    const headers = {
      "Content-Type": "application/json",
    };
    const res = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(request.body),
    });

    const posted_user = await res.text();
    const details = JSON.parse(posted_user);
    console.log("Returned user:", details);
    console.log(details);

    if (details === "User details is of the wrong format") {
      response.status(401); //401 Unauthorized
      response.setHeader("Content-Type", "text/html");
      response.render("user/user_details", {
        feedback: "Invalid details format",
        username,
        email: "",
        password: "",
        games: [],
      });
      return;
    } else if (details === "UNIQUE constraint failed: users.email") {
      response.status(401); //401 Unauthorized
      response.setHeader("Content-Type", "text/html");
      response.render("user/user_details", {
        feedback: "That email already exists",
        username,
        email: "",
        password: "",
        games: [],
      });
      return;
    } else if (details === "UNIQUE constraint failed: users.username") {
      response.status(401); //401 Unauthorized
      response.setHeader("Content-Type", "text/html");
      response.render("user/user_details", {
        feedback: "That username already exists",
        username,
        email: "",
        password: "",
        games: [],
      });
      return;
    } else {
      response.status(200);
      response.setHeader("Content-Type", "text/html");
      response.redirect("/games/" + username);
      return;
    }
  } else {
    response.status(401); //401 Unauthorized
    response.setHeader("Content-Type", "text/html");
    response.render("user/user_details", {
      feedback: "Please provide both a username and password",
      username,
      email: "",
      password: "",
      games: [],
    });
    return;
  }
}); //POST /user

app.post("/games", async function (request, response) {
  console.log(request.method, request.url, request.body); //event logging

  //Get game information from body of POST request
  const username = request.body.username;
  const game_name = request.body.game_name;

  // HEADs UP: You really need to validate this information!
  console.log("Info recieved:", username, game_name);

  const game_url = "http://127.0.0.1:5000/games";
  const headers = {
    "Content-Type": "application/json",
  };
  const game_res = await fetch(game_url, {
    method: "POST",
    headers,
    body: JSON.stringify({ name: game_name }),
  });

  const posted_game = await game_res.text();
  const game = JSON.parse(posted_game);
  if (
    game === "UNIQUE constraint failed: games.link" ||
    game === "game details is of the wrong format"
  ) {
    response.status(401);
    response.setHeader("Content-Type", "text/html");
    response.redirect("/games/" + username + "?feedback=invalid");
    return;
  }

  console.log("Returned game:", game);

  const user_url = "http://127.0.0.1:5000/users/" + username;
  const user_res = await fetch(user_url);
  const user = JSON.parse(await user_res.text());

  const scorecard_url = "http://127.0.0.1:5000/scorecards";
  const scorecard_res = await fetch(scorecard_url, {
    method: "POST",
    headers,
    body: JSON.stringify({ game_id: game.id, user_id: user.id, turn_order: 1 }),
  });

  const posted_scorecard = await scorecard_res.text();
  const scorecard = JSON.parse(posted_scorecard);
  console.log("Returned scorecard:", scorecard);

  response.status(200);
  response.setHeader("Content-Type", "text/html");
  response.redirect("/games/" + username);
}); //POST /games

// Because routes/middleware are applied in order,
// this will act as a default error route in case of
// a request fot an invalid route
app.use("", function (request, response) {
  response.status(404);
  response.setHeader("Content-Type", "text/html");
  response.render("error", {
    errorCode: "404",
    feedback: "",
    username: "",
  });
  return;
});

//..............Start the server...............................//
const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server started at http://127.0.0.1:" + port + ".");
});
