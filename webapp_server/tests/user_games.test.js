const puppeteer = require("puppeteer");
const fetch = require("node-fetch");

let {
  add_users_to_DB,
  add_1_player_games,
  delete_all_scorecards_from_DB,
  delete_all_games_from_DB,
  delete_all_users_from_DB,
} = require("./util.js");

let url_base = "http://127.0.0.1:3000";
let num_games_per_user = 3;

describe("user_games.html", () => {
  let browser;
  let page;
  let users;
  let game_names;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    await delete_all_scorecards_from_DB();
    await delete_all_games_from_DB();
    await delete_all_users_from_DB();

    users = await add_users_to_DB(4);
    game_names = await add_1_player_games(users, num_games_per_user);
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
    await delete_all_scorecards_from_DB();
    await delete_all_games_from_DB();
    await delete_all_users_from_DB();
  });

  describe("1) Required HTML Elements", () => {
    it("1.1: user_games.html should contain all required elements", async () => {
      await page.goto(url_base + "/games/" + users[0]["username"], {
        waitUntil: "domcontentloaded",
      });
      let required = {
        "#game_name_input": {
          tagName: "INPUT",
        },
        "#username_input": {
          tagName: "INPUT",
        },
        "#create_button": {
          tagName: "BUTTON",
        },
        "#user_games_ol": {
          tagName: "OL",
        },
        "#high_scores_ol": {
          tagName: "OL",
        },
        "#feedback": {
          tagName: "SECTION",
        },
        "#my_games_link": {
          tagName: "A",
          href: "/games/" + users[0]["username"],
        },
        "#user_details_link": {
          tagName: "A",
          href: "/users/" + users[0]["username"],
        },
      };

      for (let i = 1; i <= num_games_per_user; i++) {
        let game_name = users[0]["username"] + "game" + i;
        let play_game_id = "#game_link_" + game_name;
        required[play_game_id] = {
          tagName: "A",
          href: "/games/" + game_name + "/" + users[0]["username"],
        };
        let del_game_id = "#delete_link_" + game_name;
        required[del_game_id] = {
          tagName: "A",
          href: "/games/delete/" + game_name + "/" + users[0]["username"],
        };
      }

      for (let key in required) {
        const element = await page.$(key);
        if (!element) {
          console.log(key);
        }
        expect(element).toBeTruthy(); //Element is present
        const element_tagName = await page.$eval(
          key,
          (element) => element.tagName
        );
        expect(element_tagName).toBe(required[key]["tagName"]); //Element is correct tag type
        if (required[key]["href"]) {
          const element_href = await page.$eval(key, (element) => element.href);
          expect(element_href).toBe(url_base + required[key]["href"]); //Element is correct tag type
        }
      }
      const title = await page.title();
      expect(title).toBe("Yahtzee: My Games");
    });
  }); //Required HTML Elements

  describe("2) Create Game Button", () => {
    it("2.1: should create a game when Create Game button clicked with a valid game name", async () => {
      let new_game_name = users[0]["username"] + "__game__ghj";
      let new_game_link_id = "#game_link_" + new_game_name;

      await page.goto(url_base + "/games/" + users[0]["username"], {
        waitUntil: "domcontentloaded",
      });
      await page.type("#game_name_input", new_game_name);
      await page.click("#create_button");
      await page.waitForTimeout(1000); //pause to let the browser load the DOM
      const title = await page.title();
      expect(title).toBe("Yahtzee: My Games");

      //The new game should appear on the page
      const element = await page.$(new_game_link_id);
      expect(element).toBeTruthy(); //Element is present

      //The new game should link to the correct game page
      const element_href = await page.$eval(
        new_game_link_id,
        (element) => element.href
      );
      expect(element_href).toBe(
        url_base + "/games/" + new_game_name + "/" + users[0]["username"]
      );

      //The new game should be added to the DB server
      url = "http://127.0.0.1:5000/games";
      res = await fetch(url);
      let returned_games = await res.text();
      let all_games = JSON.parse(returned_games);

      let found = false;
      for (let game of all_games) {
        if (game.name == new_game_name) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    }); //Create Game Button

    it("2.2: should provide feedback when Create Game button clicked with no information", async () => {
      let new_game_name = "";
      let new_game_link_id = "#game_link_" + new_game_name;

      await page.goto(url_base + "/games/" + users[1]["username"], {
        waitUntil: "domcontentloaded",
      });
      await page.type("#game_name_input", "");
      await page.click("#create_button");
      await page.waitForTimeout(1000); //pause to let the browser load the DOM
      const title = await page.title();
      expect(title).toBe("Yahtzee: My Games");
      let feedback = await page.$eval(
        "#feedback",
        (element) => element.innerHTML
      );
      expect(feedback.length).toBeGreaterThan(10);

      //New game should not appear in the list of user games
      const element = await page.$(new_game_link_id);
      expect(element).toBe(null); //Element is not present

      //New game should not be added to the DB server
      url = "http://127.0.0.1:5000/games";
      res = await fetch(url);
      let returned_games = await res.text();
      let all_games = JSON.parse(returned_games);

      let found = false;
      for (let game of all_games) {
        console.log("game name", game.name)
        if (game.name == new_game_name) {
          found = true;
          break;
        }
      }
      expect(found).toBe(false);
    });

    it("2.3: should provide feedback when Create Game button clicked with a duplicate game name", async () => {
      url = "http://127.0.0.1:5000/games";
      res = await fetch(url);
      let returned_games = await res.text();
      let orig_all_games = JSON.parse(returned_games);

      await page.goto(url_base + "/games/" + users[2]["username"], {
        waitUntil: "domcontentloaded",
      });
      await page.type("#game_name_input", game_names[users[2]["username"]][0]);
      await page.click("#create_button");
      await page.waitForTimeout(1000); //pause to let the browser load the DOM
      const title = await page.title();
      expect(title).toBe("Yahtzee: My Games");
      let feedback = await page.$eval(
        "#feedback",
        (element) => element.innerHTML
      );
      expect(feedback.length).toBeGreaterThan(10);

      //New game should not be added to the DB server
      url = "http://127.0.0.1:5000/games";
      res = await fetch(url);
      returned_games = await res.text();
      let final_all_games = JSON.parse(returned_games);

      expect(final_all_games.length).toBe(orig_all_games.length);
    });
  }); //Create Game Button

  describe("3) Delete Game Links", () => {
    it("3.1: should delete a game when the delete link is pressed", async () => {
      await page.goto(url_base + "/games/" + users[2]["username"], {
        waitUntil: "domcontentloaded",
      });
      let game_name = users[2]["username"] + "game1";
      let play_game_id = "#game_link_" + game_name;
      let element = await page.$(play_game_id);
      expect(element).toBeTruthy(); //Element is present

      let del_game_id = "#delete_link_" + game_name;
      await page.click(del_game_id);
      await page.waitForTimeout(1000); //pause to let the browser load the DOM

      element = await page.$(play_game_id);
      expect(element).toBe(null); //Game link is not present on page
      element = await page.$(del_game_id);
      expect(element).toBe(null); //Delete link is not present on page

      //game is no longer present in DB
      url = "http://127.0.0.1:5000/games";
      res = await fetch(url);
      returned_games = await res.text();
      let all_games = JSON.parse(returned_games);
      for (game of all_games) {
        expect(game_name).not.toEqual(game["name"]);
      }

      const title = await page.title();
      expect(title).toBe("Yahtzee: My Games");
    });
  }); //Delete Game Links
});
