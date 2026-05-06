import fs from 'fs';
// Import vanilla puppeteer and the addExtra wrapper
import vanillaPuppeteer from 'puppeteer';
import { addExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { spawnSync } from 'child_process';

const puppeteer = addExtra(vanillaPuppeteer as any);

puppeteer.use(StealthPlugin());

export async function scraper(): Promise<any[] | null> {
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
    return null;
  }

  // Checks if ah-cookies.json is empty; if not, reads cookies
  const cookiesString: string = fs.readFileSync('./ah-cookies.json').toString();
  if (cookiesString.trim() === "") {
    console.log("No cookies found. Running login.");
    await browser.close();
    return null;
  }
  
  const cookies = JSON.parse(cookiesString);

  // Checks if the session id exists
  if (!cookies.find((item: any) => item.name === "ASP.NET_SessionId")) {
    console.log("Secure SID not found. Running login.");
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
  page.goto('https://archershub.dlsu.edu.ph/StudentDashboard', { 
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

  let sessionId = cookiesObj["ASP.NET_SessionId"];

  const process = spawnSync('python3', ['./scraper.py', sessionId], { encoding: 'utf-8' });

  if (process.error) {
    console.error('Error parsing: ' + process.error.message);
    return null;
  }

  console.log("Course fetching successful. Rewriting cookies.")

  // Rewriting the cookies just in case 
  const updatedCookies = await browser.cookies();
  fs.writeFileSync('./ah-cookies.json', JSON.stringify(updatedCookies, null, 2));

  console.log("Cookies saved to ah-cookies.json. Closing browser.");
  await browser.close();

  return JSON.parse(process.stdout.trim());
}