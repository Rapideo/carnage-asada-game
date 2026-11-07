/* Service Mode: node admin.mjs -> the game plus the content editor on localhost:8124.
   Dev-only; never bundled into taco-shop.html. */
import { startAdmin } from './tools/content/server.mjs';

const { url } = await startAdmin({ root: process.cwd() });
console.log('Service Mode at ' + url);
