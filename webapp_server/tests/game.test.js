const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

let {add_users_to_DB, add_1_player_games, delete_all_scorecards_from_DB, delete_all_games_from_DB, delete_all_users_from_DB }
= require('./util.js')

let url_base='http://127.0.0.1:3000'
let num_games_per_user=3;

describe('game.html', () => {
  let browser;
  let page;
  let users;
  let game_names;

  beforeAll(async () => {
    browser = await puppeteer.launch({headless:true}); 
    await delete_all_scorecards_from_DB()
    await delete_all_games_from_DB()
    await delete_all_users_from_DB()

    users= await add_users_to_DB(4)
    game_names = await add_1_player_games(users, num_games_per_user)
  });

  beforeEach(async () => {
    page = await browser.newPage()
  });

  afterEach(async () => {
    await page.close()
  });

  afterAll(async () => {
    await browser.close()
    await delete_all_scorecards_from_DB()
    await delete_all_games_from_DB()
    await delete_all_users_from_DB()   
  });

  describe('1) Required HTML Elements', () => {
    it("1.1: user_games.html should contain all required elements", async () => {
      let game_name=users[0]["username"]+"_game_0";
      let username=users[0]["username"];
      await page.goto(url_base+'/games/'+game_name+'/'+username, {waitUntil: 'domcontentloaded'})
      let  required={
        '#one_input':{
            "tagName":'INPUT'
        },
        '#two_input':{
            "tagName":'INPUT'
        },
        '#three_input':{
            "tagName":'INPUT'
        },
        '#four_input':{
            "tagName":'INPUT'
        },
        '#five_input':{
            "tagName":'INPUT'
        },
        '#six_input':{
            "tagName":'INPUT'
        },
        '#three_of_a_kind_input':{
            "tagName":'INPUT'
        },
        '#four_of_a_kind_input':{
            "tagName":'INPUT'
        },
        '#full_house_input':{
            "tagName":'INPUT'
        },
        '#small_straight_input':{
            "tagName":'INPUT'
        },
        '#large_straight_input':{
            "tagName":'INPUT'
        },
        '#yahtzee_input':{
            "tagName":'INPUT'
        },
        '#chance_input':{
            "tagName":'INPUT'
        },
        '#upper_score':{
            "tagName":'TD'
        },
        '#upper_bonus':{
            "tagName":'TD'
        },
        '#upper_total':{
            "tagName":'TD'
        },
        '#lower_score':{
            "tagName":'TD'
        },
        '#upper_total_lower':{
            "tagName":'TD'
        },
        '#grand_total':{
            "tagName":'TD'
        },
        '#chat_textarea':{
          "tagName":'TEXTAREA'
        },
        '#chat_input':{
          "tagName":'INPUT'
        },
        '#chat_button':{
          "tagName":"BUTTON"
        },
        '#feedback':{
          "tagName":"SECTION"
        },
        '#my_games_link':{
          "tagName":"A",
          "href":"/games/"+users[0]["username"]
        },
        '#user_details_link':{
          "tagName":"A",
          "href":"/users/"+users[0]["username"]
        }
      } 

      for (let key in required){
        const element = await page.$(key);
        if (element == null){
          console.log(key)
        }
        expect(element).toBeTruthy(); //Element is present
        const element_tagName = await page.$eval(key, element => element.tagName);
        expect(element_tagName).toBe(required[key]["tagName"]);//Element is correct tag type
        if(required[key]["href"]){
          const element_href = await page.$eval(key, element => element.href);
          expect(element_href).toBe(url_base+required[key]["href"]);//Element is correct tag type
        }
      }
      const title = await page.title();
      expect(title).toBe('Yahtzee: '+game_name+'|'+username);
    })
  });//Required HTML Elements

});
