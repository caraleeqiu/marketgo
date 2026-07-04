import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

// Carregadas do public/ do bundle — sem rede na hora do render.
loadFont({
  family: 'Montserrat',
  url: staticFile('fonts/montserrat-latin-700-normal.woff2'),
  weight: '700',
});

loadFont({
  family: 'Montserrat',
  url: staticFile('fonts/montserrat-latin-400-normal.woff2'),
  weight: '400',
});
