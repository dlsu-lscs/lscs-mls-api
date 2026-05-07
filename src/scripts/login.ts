import fs from 'fs';
import { otpFetch } from './otp.js';
import vanillaPuppeteer from 'puppeteer';
import { addExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createWorker } from 'tesseract.js';

const puppeteer = addExtra(vanillaPuppeteer as any);

puppeteer.use(StealthPlugin());

export async function isValidSession(): Promise<boolean> {
  let cookiesObj;

  const browser = await puppeteer.launch({ 
    headless: true 
  });
  
  const page = await browser.newPage();
  page.setDefaultTimeout(600000);

  // Checks if the cookies file exists
  if (!fs.existsSync('./ah-cookies.json')) {
    console.log("No cookie file found. Running login.");
    await browser.close();
    return false;
  }

  // Checks if ah-cookies.json is empty; if not, reads cookies
  const cookiesString: string = fs.readFileSync('./ah-cookies.json').toString();
  if (cookiesString.trim() === "") {
    console.log("No cookies found. Running login.");
    await browser.close();
    return false;
  }
  
  const cookies = JSON.parse(cookiesString);

  // Checks if the session id exists
  if (!cookies.find((item: any) => item.name === "ASP.NET_SessionId")) {
    console.log("Secure SID not found. Running login.");
    await browser.close();
    return false;
  }
  
  cookiesObj = Object.fromEntries(
    cookies.map((item: any) => [item.name, item.value])
  );
  
  // Injects them into the browser before opening AH
  await browser.setCookie(...cookies);
  console.log("ArchersHub Opened. Session cookies injected.");
  
  // Navigates to AH for instant log in (if cookies are still active).
  page.goto('https://archershub.dlsu.edu.ph/StudentDashboard', { 
    waitUntil: 'networkidle2' 
  });
  
  try {
    await page
      .waitForSelector('#SPInsName', { timeout: 10000 })
      .then(() => console.log('Session is valid.'));
  } catch (e) {
    console.error("Cookies have expired. Running login.");
    await browser.close();
    return false;
  }

  return true;
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
    const element = await page.$('#CaptchaImageLogin');
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

    await page.waitForSelector('#SPInsName', { visible: true, timeout: 15000 });
    
    console.log("Logging in to ArchersHub.");

    await new Promise(r => setTimeout(r, 5000)); 
    
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