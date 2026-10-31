import fs from 'fs';
import { otpFetch } from './otp.js';
import vanillaPuppeteer from 'puppeteer';
import { addExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createWorker } from 'tesseract.js';
import { connect } from 'puppeteer-real-browser';

const puppeteer = addExtra(vanillaPuppeteer as any);

puppeteer.use(StealthPlugin());

const BROWSER_CONFIG = {
  args: [
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080',
      '--enable-gpu', 
      '--enable-gpu-rasterization',
      '--ignore-gpu-blocklist', 
      '--enable-unsafe-webgpu',
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
  const { page, browser } = await connect({
    headless: false,
    ...BROWSER_CONFIG
  });

  await page.setDefaultTimeout(300000);

  // Hook the site's own Turnstile success callback so we get an exact signal
  // the moment a human solves it — this only *observes* the callback, it doesn't
  // touch how the challenge itself is solved.
  await page.evaluateOnNewDocument(() => {
    (window as any).__turnstileSolved = false;
    const originalCallbackName = 'onCloudflareTurnstileSuccess';

    // Wrap the site's function once it's defined
    Object.defineProperty(window, originalCallbackName, {
      configurable: true,
      set(fn) {
        (window as any).__realTurnstileCallback = fn;
      },
      get() {
        return (token: string) => {
          (window as any).__turnstileSolved = true;
          console.log('[page] Turnstile solved, token received');
          if ((window as any).__realTurnstileCallback) {
            (window as any).__realTurnstileCallback(token);
          }
        };
      }
    });
  });

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
    await page.click('#btnSignIn');

    await new Promise(r => setTimeout(r, 7500)); 

    console.log("Waiting for next step (OTP or Dashboard)...");
    
    // Wait for either the OTP field or the Dashboard to load
    const nextStep = await Promise.race([
        page.waitForSelector('#btnTwoStepVerifyOTP', { visible: true, timeout: 15000 }).then(() => 'OTP'),
        page.waitForSelector('#SPInstLogo', { visible: true, timeout: 15000 }).then(() => 'DASHBOARD')
    ]).catch(() => 'UNKNOWN');

    if (nextStep === 'OTP') {
      console.log("OTP Required. Fetching OTP.");
      await new Promise(r => setTimeout(r, 5000)); 
      const otp = await otpFetch();
      if (!otp) throw new Error("OTP not fetched successfully.");
  
      await page.type('#txtTwoStepOTP', otp, { delay: 100 });
      await page.click('#btnTwoStepVerifyOTP');

      await new Promise(r => setTimeout(r, 5000)); 
      
      // Wait for dashboard after OTP
      await page.waitForSelector('#SPInstLogo', { visible: true, timeout: 15000 });
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