const puppeteer = require('puppeteer');
let {add_users_to_DB, delete_all_users_from_DB } = require('./util.js')

let url_base='http://127.0.0.1:3000'

describe('login.html', () => {
  let browser;
  let page;
  let users;

  beforeAll(async () => {
    browser = await puppeteer.launch({headless:false}); 
    await delete_all_users_from_DB()
    users= await add_users_to_DB(4)
  });

  beforeEach(async () => {
    page = await browser.newPage()
    await page.goto(url_base, {waitUntil: 'domcontentloaded'})
  });

  afterEach(async () => {
    await page.close()
  });

  afterAll(async () => {
    await browser.close()
    await delete_all_users_from_DB()
  });

  describe('1) Required HTML Elements', () => {
    it("1.1: login.html should contain all required elements", async () => {
      let  required={
        '#username_input':'INPUT',
        '#password_input':'INPUT',
        '#login_button':"BUTTON",
        '#create_link':"A",
        '#feedback':"SECTION"
      }  
      for (let key in required){
        const element = await page.$(key);
        expect(element).toBeTruthy(); //Element is present
        const element_tagName = await page.$eval(key, element => element.tagName);
        expect(element_tagName).toBe(required[key]);//Element is correct tag type
      }
      const title = await page.title();
      expect(title).toBe('Yahtzee: Login');
    })
  });//Required HTML Elements

  describe('2) Login Button', () => {
    it('2.1: Login w/ Valid username, Valid password', async () => {
      let username = users[1]["username"];
      let password = users[1]["password"];
      await page.type('#username_input', username);
      await page.type('#password_input', password);
      await page.click('#login_button');
      await page.waitForTimeout(2000)
      expect(page.url()).toBe(url_base+"/login?username="+username+"&password="+password);
      const title = await page.title();
      expect(title).toBe('Yahtzee: My Games');
    });
    it('2.2: Login w/ Valid username, wrong password', async () => {
      let username = users[2]["username"];
      let password = users[2]["password"]+"123"
      await page.type('#username_input', username);
      await page.type('#password_input',password );
      await page.click('#login_button');
      await page.waitForTimeout(2000)
      expect(page.url()).toBe(url_base+"/login?username="+username+"&password="+password);
      const title = await page.title();
      expect(title).toBe('Yahtzee: Login');
      let feedback = await page.$eval("#feedback", element => element.innerHTML);
      expect(feedback.length).toBeGreaterThan(10);
    });
    it('2.3: Login w/ Wrong username', async () => {
      let username = users[2]["username"]+"55555555";
      let password = users[2]["password"]
      await page.type('#username_input', username);
      await page.type('#password_input',password );
      await page.click('#login_button');
      await page.waitForTimeout(2000)
      expect(page.url()).toBe(url_base+"/login?username="+username+"&password="+password);
      const title = await page.title();
      expect(title).toBe('Yahtzee: Login');
      let feedback = await page.$eval("#feedback", element => element.innerHTML);
      expect(feedback.length).toBeGreaterThan(10);
    });
    it('2.4 Login w/ Blank username, Blank password', async () => {
      await page.type('#username_input', '');
      await page.type('#password_input', '');
      await page.click('#login_button');
      await page.waitForTimeout(2000)
      expect(page.url()).toBe(url_base+"/login?username=&password=");
      let feedback = await page.$eval("#feedback", element => element.innerHTML);
      expect(feedback.length).toBeGreaterThan(10);
      const title = await page.title();
      expect(title).toBe('Yahtzee: Login');
    });
  });//Login Button
  describe('3) Create User Button', () => {
    it('3.1: should redirect to blank user_details.html', async () => {
      await page.click('#create_link');
      expect(page.url()).toBe(url_base+"/users");
      const title = await page.title();
      expect(title).toBe('Yahtzee: User Details');
    });
  });//Create User Button

});
