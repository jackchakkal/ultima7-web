// Texts drawn by the original engine fonts (menu, credits, ending).
// Accented letters live in spare low frames of the PT-BR menu font (see engine/build_menu.py).
const ACCENTED='áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ',CODES=[3,4,5,6,7,8,11,12,14,15,16,17,18,19,20,21,22,23,24,25,27,28,29,30];
export const toMenuFont=text=>[...text].map(c=>{const i=ACCENTED.indexOf(c);return i<0?c:String.fromCharCode(CODES[i]);}).join('');
export const stripAccents=text=>text.normalize('NFD').replace(/[̀-ͯ]/g,'');
const P='%Y%J';
const ENDING={'pt-BR':{
 'No!  You must not!':'Não!  Não deves fazer isso!',
 'Damn you Avatar!  Damn you!':'Maldito sejas, Avatar!  Maldito!',
 'The Black Gate is destroyed.':'O Portal Negro foi destruído.',
 'The Guardian has been stopped.':'O Guardião foi detido.',
 'Avatar!  You think you have won?':'Avatar!  Pensas que venceste?',
 'Think again!  You are unable to':'Pensa de novo!  Tu não podes',
 'leave Britannia, whereas I am free':'deixar Britannia, mas eu estou livre',
 'to enter other worlds!  Hmmm...':'para entrar em outros mundos!  Hmmm...',
 'Perhaps your puny Earth shall be':'Talvez tua Terra insignificante seja',
 'my NEXT target!':'meu PRÓXIMO alvo!',
 'In the months following the climactic':'Nos meses que se seguiram à decisiva',
 'battle at The Black Gate, Britannia':'batalha no Portal Negro, Britannia',
 'is set upon the long road to recovery':'trilhou o longo caminho da recuperação',
 'from its various plights.':'de suas muitas aflições.',
 'Upon your return to Britain,':'Após o seu retorno a Britain,',
 'Lord British decreed that':'Lord British decretou que',
 'The Fellowship be outlawed,':'a Irmandade fosse proscrita,',
 'and all of the branches were':'e todas as suas filiais foram',
 'soon destroyed.':'logo destruídas.',
 'The frustration you feel at having been':'A frustração de ter ficado preso',
 'stranded in Britannia is somewhat':'em Britannia é um tanto',
 'alleviated by the satisfaction that you':'aliviada pela satisfação de ter',
 'solved the gruesome murders committed':'solucionado os assassinatos medonhos',
 'by The Fellowship and even avenged the':'da Irmandade e até vingado',
 "death of Spark's father.":'a morte do pai de Spark.',
 'And although you are, at the moment, ':'E embora, por ora, nada possa',
 'helpless to do anything about':'ser feito quanto à',
 "The Guardian's final threat,":'ameaça final do Guardião,',
 'another thought nags at you...':'outra dúvida não lhe sai da cabeça...',
 'what became of Batlin, the fiend':'o que terá sido de Batlin, o vilão',
 'who got away?':'que escapou?',
 'That is another story...':'Essa é outra história...',
 'one that will take you':'uma que conduzirá seus passos',
 'to a place called':'a um lugar chamado',
 'The Serpent Isle...':'Ilha da Serpente...',
 'Congratulations!':'Parabéns!',
 'You have completed Ultima VII in':'Você concluiu Ultima VII em',
 'Please write Lord British,':'Escreva a Lord British,',
 'in care of Origin Systems Inc.,':'aos cuidados da Origin Systems Inc.,',
 'telling him of your':'contando-lhe sobre o seu',
 'accomplishment!':'feito!',
}};
const DATES={'pt-BR':{'%d year':'%d ano','%d years':'%d anos','%d month':'%d mês','%d months':'%d meses','%d day':'%d dia','%d days':'%d dias',', & ':' e '}};
const CLOSING={'pt-BR':['\\CFIM DE ULTIMA VII','\\CO FIM DE BRITANNIA COMO VOCÊ A CONHECE...'],es:['\\CFIN DE ULTIMA VII','\\CEL FIN DE BRITANNIA TAL COMO LA CONOCES...']};
// The ending's own fonts have no accented letters.
export function endgameTexts(language){
 const out={};
 for(const [en,text] of Object.entries(ENDING[language]||{}))out[P+en]=P+stripAccents(text);
 for(const [en,text] of Object.entries(DATES[language]||{}))out[en]=stripAccents(text);
 return out;
}
export function closingTexts(language){
 const lines=CLOSING[language];if(!lines)return {};
 const font=language==='pt-BR'?toMenuFont:stripAccents;
 return {3:font(lines[0]),4:font(lines[1])};
}
