import { Jimp } from 'jimp';
import path from 'path';

async function resizeIcons() {
  try {
    const img192 = await Jimp.read('public/pwa-192x192.png');
    img192.resize({ w: 192, h: 192 });
    await img192.write('public/pwa-192x192.png');
    console.log('Resized 192x192');

    const img512 = await Jimp.read('public/pwa-512x512.png');
    img512.resize({ w: 512, h: 512 });
    await img512.write('public/pwa-512x512.png');
    console.log('Resized 512x512');
  } catch (err) {
    console.error(err);
  }
}

resizeIcons();
