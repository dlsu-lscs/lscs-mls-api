import fs from 'fs';
import vanillaPuppeteer from 'puppeteer';
import { addExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { spawnSync } from 'child_process';

const puppeteer = addExtra(vanillaPuppeteer as any);

puppeteer.use(StealthPlugin());

export async function fetch(part: number = 0, term: number = 0): Promise<any[] | null> {
  let cookiesObj;

  const browser = await puppeteer.launch({ 
    headless: true 
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
  if (!cookies.find((item: any) => item.name === "ASP.NET_SessionId")) {
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

  await browser.close();

  let sessionId = cookiesObj["ASP.NET_SessionId"];

  const pythonBin = process.platform === 'win32' ? 'python' : 'python3';
  const result = spawnSync(pythonBin, ['./src/scripts/scraper.py', sessionId, part, term], { encoding: 'utf-8' });

  if (result.error) {
    console.error('Error parsing: ' + result.error.message);
    return null;
  }

  if (result.status !== 0 || !result.stdout.trim()) {
    console.error('Scraper exited with code', result.status);
    console.error('stderr:', result.stderr);
    return null;
  }

  console.log("Course fetching successful.");

  return JSON.parse(result.stdout.trim());
}