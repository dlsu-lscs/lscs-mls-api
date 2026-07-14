import fs from 'fs';
import { otpFetch } from './otp.js';
import vanillaPuppeteer from 'puppeteer';
import { addExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createWorker } from 'tesseract.js';

const puppeteer = addExtra(vanillaPuppeteer as any);

puppeteer.use(StealthPlugin());

export async function isValidSession(): Promise<boolean> {
  // File checks — no browser needed for these
  if (!fs.existsSync('./ah-cookies.json')) {
    console.log("No cookie file found. Running login.");
    return false;
  }

  const cookiesString: string = fs.readFileSync('./ah-cookies.json').toString();
  if (cookiesString.trim() === "") {
    console.log("No cookies found. Running login.");
    return false;
  }

  const cookies = JSON.parse(cookiesString);
  if (!cookies.find((item: any) => item.name === "__Secure-SID")) {
    console.log("Session ID not found. Running login.");
    return false;
  }

  // Only launch browser if cookie file looks valid
  const browser = await puppeteer.launch({ 
    headless: true
  });
  
  const page = await browser.newPage();
  page.setDefaultTimeout(600000);

  try {
    await browser.setCookie(...cookies);
    console.log("ArchersHub Opened. Session cookies injected.");

    await page.goto('https://archershub.dlsu.edu.ph/StudentDashboard', {
      waitUntil: 'networkidle2'
    });

    await page.waitForSelector('#SPInsName', { timeout: 10000 });
    console.log('Session is valid.');
    return true;
  } catch (e) {
    console.error("Cookies have expired. Running login.");
    return false;
  } finally {
    await browser.close();
  }
}

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
    await page.type('#txtuserid', process.env.AH_USERNAME as string, { delay: 100 });
    await page.type('#txtpassword', process.env.AH_PASSWORD as string, { delay: 100 });

    // Identifies captcha image and performs OCR
    const element = await page.$('#captchaImageLogin');
    await element?.screenshot({ path: 'captcha.png' });

    const worker = await createWorker('eng');
    const captcha = await worker.recognize('./captcha.png');
    await worker.terminate();

    // Enters captcha
    await page.type('#txtCaptchaTextLogin', captcha.data.text, { delay: 100 });

    // Enters OTP
    await page.waitForSelector('#btnTwoStepVerifyOTP', { visible: true, timeout: 10000 });
    await new Promise(r => setTimeout(r, 5000)); 
    console.log("Fetching OTP.");
    const otp = await otpFetch();

    if (!otp) {
      throw new Error("OTP not fetched successfully.");
    }

    await page.type('#txtTwoStepOTP', otp, { delay: 100 });
    await page.click('#btnTwoStepVerifyOTP');

    await page.setViewport({ width: 1920, height: 1080 });
    await page.waitForSelector('#SPInsName', { visible: true, timeout: 15000 });
    
    console.log("Logging in to ArchersHub.");

    await new Promise(r => setTimeout(r, 5000)); 
    
    console.log("Logged in to ArchersHub. Extracting cookies.");

    // Extracts browser cookies
    const cookies = await browser.cookies();
    fs.writeFileSync('./ah-cookies.json', JSON.stringify(cookies, null, 2));

    console.log("Cookies saved to ah-cookies.json.");
  } catch (e: any) {
    throw e;
  } finally {
    await browser.close();
  }
}