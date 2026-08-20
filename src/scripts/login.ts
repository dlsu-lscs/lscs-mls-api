import fs from 'fs';
import { otpFetch } from './otp.js';
import vanillaPuppeteer from 'puppeteer';
import { addExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createWorker } from 'tesseract.js';

const puppeteer = addExtra(vanillaPuppeteer as any);

puppeteer.use(StealthPlugin());

const BROWSER_CONFIG = {
  args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080',
    ],
    defaultViewport: {
      width: 1920,
      height: 1080
    }
}

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
    headless: true,
    ...BROWSER_CONFIG
  });
  
  const page = await browser.newPage();
  page.setDefaultTimeout(300000);

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
    headless: false,
    ...BROWSER_CONFIG
  });

  const page = await browser.newPage();
  await page.setDefaultTimeout(300000);
  await page.goto('https://archershub.dlsu.edu.ph');

  try {
    console.log("Opening ArchersHub.");
    
    // Searches html for selectors
    await page.waitForSelector('#txtuserid', { visible: true });
    await page.waitForSelector('#txtpassword', { visible: true });
    await page.waitForSelector('#btnSignIn', { visible: true });
    
    // Enters username and password
    await page.type('#txtuserid', process.env.AH_USERNAME as string, { delay: 300 });
    await page.type('#txtpassword', process.env.AH_PASSWORD as string, { delay: 300 });

    await new Promise(r => setTimeout(r, 15000)); 

    const hasImageCaptcha = await page.$('#captchaImageLogin') !== null;
    let turnstileFrame = null;
    for (const frame of page.frames()) {
      if (frame.url().includes('cloudflare') || frame.url().includes('turnstile')) {
        turnstileFrame = frame;
        break;
      }
    }

    if (hasImageCaptcha) {
      console.log("Image Captcha detected. Processing OCR...");

      // Identifies captcha image and performs OCR
      const element = await page.$('#captchaImageLogin');
      await element?.screenshot({ path: 'captcha.png' });
  
      const worker = await createWorker('eng');
      const captcha = await worker.recognize('./captcha.png');
      await worker.terminate();
  
      // Enters captcha
      await page.type('#txtCaptchaTextLogin', captcha.data.text, { delay: 100 });
    } else if (turnstileFrame) {
      console.log("\n=== ACTION NEEDED ===");
      console.log("Cloudflare Turnstile detected. Please solve it manually in the browser window.");
      console.log("Waiting for you to complete it (up to 2 minutes)...\n");

      const maxWaitMs = 120000; // 2 minutes to solve it yourself
      const pollIntervalMs = 1000;
      let waited = 0;
      let isDisabled = true;

      while (waited < maxWaitMs) {
        isDisabled = await page.$eval('#btnSignIn', el => (el as HTMLButtonElement).disabled)
          .catch(() => true); // if button vanished (e.g. page navigated already), stop waiting

        if (!isDisabled) break;

        await new Promise(r => setTimeout(r, pollIntervalMs));
        waited += pollIntervalMs;

        // Friendly nudge every 30s so you know it's still waiting on you
        if (waited % 30000 === 0) {
          console.log(`Still waiting for Turnstile to be solved... (${waited / 1000}s elapsed)`);
        }
      }

      if (isDisabled) {
        throw new Error("Turnstile was not solved in time (2 min timeout). Aborting login.");
      }

      console.log("Turnstile passed. Continuing...");
      await page.click('#btnSignIn');
    } else {
      console.log("Login failed.");
      return false;
    }

    await new Promise(r => setTimeout(r, 10000)); 

    console.log("Waiting for next step (OTP or Dashboard)...");
    
    // Wait for either the OTP field or the Dashboard to load
    const nextStep = await Promise.race([
        page.waitForSelector('#btnTwoStepVerifyOTP', { visible: true, timeout: 15000 }).then(() => 'OTP'),
        page.waitForSelector('#SPInsName', { visible: true, timeout: 15000 }).then(() => 'DASHBOARD')
    ]).catch(() => 'UNKNOWN');

    if (nextStep === 'OTP') {
      console.log("OTP Required. Fetching OTP.");
      await new Promise(r => setTimeout(r, 5000)); 
      const otp = await otpFetch();
      if (!otp) throw new Error("OTP not fetched successfully.");
  
      await page.type('#txtTwoStepOTP', otp, { delay: 100 });
      await page.click('#btnTwoStepVerifyOTP');
      
      // Wait for dashboard after OTP
      await page.waitForSelector('#SPInsName', { visible: true, timeout: 15000 });
    } else if (nextStep === 'UNKNOWN') {
      throw new Error("Failed to reach Dashboard or OTP screen.");
    }
    
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