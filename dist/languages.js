// Every language the game can be played in (docs/ADDING_A_LANGUAGE.md).
//   code    BCP 47 tag, also the ?lang= value and the save profile name
//   patch   folder under dist/patch/ with the translated game files ('' = dist/patch/)
//   files   translated game files written over STATIC/ before the engine starts
//   ui      dictionary used for the page (falls back to English)
//   status  'available' shows in the language menu; 'planned' is listed for
//           contributors only, until its files exist
const SCRIPT=['USECODE','TEXT.FLX','FONTS.VGA','LINKDEP1','LINKDEP2'];
const ART=['GUMPS.VGA','MAINSHP.FLX','POINTERS.SHP'];
export const LANGUAGES=[
 {code:'en',name:'English (original)',patch:'en',files:['GUMPS.VGA'],ui:'en',status:'available'},
 {code:'pt-BR',name:'Português do Brasil',patch:'',files:[...SCRIPT,...ART,'ENDSHAPE.FLX'],ui:'pt-BR',status:'available'},
 {code:'es',name:'Español',patch:'es',files:[...SCRIPT,...ART],ui:'es',status:'available'},
 {code:'it',name:'Italiano',patch:'it',files:[...SCRIPT,...ART],ui:'en',status:'planned'},
 // Cyrillic needs redrawn FONTS.VGA glyphs and a single-byte code page for the script text.
 {code:'ru',name:'Русский',patch:'ru',files:[...SCRIPT,...ART],ui:'en',status:'planned'},
];
export const DEFAULT_LANGUAGE='pt-BR';
export const playable=LANGUAGES.filter(l=>l.status==='available');
export const languageInfo=code=>LANGUAGES.find(l=>l.code===code);
// Where a language keeps its game directory in IndexedDB (kept for existing saves).
export const storageOf=code=>code===DEFAULT_LANGUAGE?'/game':`/profiles/${code}`;
export const patchUrl=(code,name)=>{const info=languageInfo(code);return `patch/${info.patch?`${info.patch}/`:''}${name}`;};
