import fs from 'fs';
import vanillaPuppeteer from 'puppeteer';
import { addExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createWorker } from 'tesseract.js';

const puppeteer = addExtra(vanillaPuppeteer as any);

puppeteer.use(StealthPlugin());

export async function login() {
  const browser = await puppeteer.launch({
    headless: true
  });

  const page = await browser.newPage();
  await page.setDefaultTimeout(600000);
  
  await page.goto('https://archershub.dlsu.edu.ph');

  try {
    console.log("Opening ArchersHub.");
    
    // Searches html for selectors
    await page.waitForSelector('#txtuserid', { visible: true });
    await page.waitForSelector('#txtpassword', { visible: true });
    await page.waitForSelector('#txtCaptchaTextLogin', { visible: true });
    await page.waitForSelector('#captchaImageLogin', { visible: true });
    await page.waitForSelector('#btnSignIn', { visible: true });
    
    // Enters username and password
    await page.type('#txtuserid', process.env.AH_USERNAME, { delay: 100 });
    await page.type('#txtpassword', process.env.AH_PASSWORD, { delay: 100 });

    // Identifies captcha image and performs OCR
    const element = await page.$('#CaptchaImageLogin');
    await element?.screenshot({ path: 'captcha.png' });

    const worker = await createWorker('eng');
    const captcha = await worker.recognize('./captcha.png');
    await worker.terminate();

    // Enters captcha
    await page.type('#txtCaptchaTextLogin', captcha.data.text, { delay: 100 });
    
    console.log("Logging in to ArchersHub.");

    await new Promise(r => setTimeout(r, 10000)); 
    
    console.log("Logged in to ArchersHub. Extracting cookies.");

    // Extracts browser cookies
    const cookies = await browser.cookies();
    fs.writeFileSync('./ah-cookies.json', JSON.stringify(cookies, null, 2));
    
    console.log("Cookies saved to ah-cookies.json.");
    await browser.close();
    return;
  } catch (e: any) {
    console.error("Failed to login. " + (e as Error).message);
    await browser.close();
    return;
  }
}