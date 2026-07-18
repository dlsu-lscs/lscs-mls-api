import fs from 'fs';
import vanillaPuppeteer from 'puppeteer';
import { addExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { spawnSync } from 'child_process';

const puppeteer = addExtra(vanillaPuppeteer as any);

puppeteer.use(StealthPlugin());

export async function fetch(
  campus: number = 0, 
  part: number = 0, 
  term: number = 0
): Promise<any[] | null> {
  let cookiesObj;

  const browser = await puppeteer.launch({ 
    headless: false
  });
  
  const page = await browser.newPage();
  page.setDefaultTimeout(600000);

  // Checks if the cookies file exists
  if (!fs.existsSync('./ah-cookies.json')) {
    console.log("No cookie file found.");
    await browser.close();
    return null;
  }

  // Checks if ah-cookies.json is empty; if not, reads cookies
  const cookiesString: string = fs.readFileSync('./ah-cookies.json').toString();
  if (cookiesString.trim() === "") {
    console.log("No cookies found.");
    await browser.close();
    return null;
  }
  
  const cookies = JSON.parse(cookiesString);

  // Checks if the session id exists
  if (!cookies.find((item: any) => item.name === "__Secure-SID")) {
    console.log("Session ID not found.");
    await browser.close();
    return null;
  }
  
  cookiesObj = Object.fromEntries(
    cookies.map((item: any) => [item.name, item.value])
  );
  
  // Injects them into the browser before opening AH
  await browser.setCookie(...cookies);
  console.log("ArchersHub Opened. Session cookies injected.");
  
  // Navigates to AH for instant log in (if cookies are still active).
  await page.goto('https://archershub.dlsu.edu.ph/StudentDashboard', { 
    waitUntil: 'networkidle2' 
  });
  
  try {
    await page
      .waitForSelector('#SPInsName', { timeout: 10000 })
      .then(() => console.log('Login successful. Fetching courses.'));
  } catch (e) {
    console.error("Cookies have expired. Running login.");
    await browser.close();
    return null;
  }

  let sessionId = cookiesObj["__Secure-SID"];

  const process = spawnSync('python3', ['./src/scripts/scraper.py', sessionId, campus, part, term], { 
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024 * 1000
  });

  console.log(process.stdout.trim())

  if (process.error) {
    console.error('Error parsing: ' + process.error.message);
    return null;
  }

  console.log("Course fetching successful.");

  return JSON.parse(process.stdout.trim());
}