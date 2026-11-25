"use strict";
// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
/** লগে বিগ টেক্সট ও মালিকের নাম দেখানোর হেল্পার */
const NAME = "━━━⃞⃟𝆠፝֟😽ꤪ𝐌⃞𝆠፝֟𝐑༊𝐉⃞𝆠፝֟𝐔𝐖𝐄⃞𝆠፝֟𝐋🎀⃞⃟𝆠፝֟࿐";
const BIG = [
  "░░░░░██╗██╗░░░██╗░██╗░░░░░░░██╗███████╗██╗░░░░░",
  "░░░░░██║██║░░░██║░██║░░██╗░░██║██╔════╝██║░░░░░",
  "░░░░░██║██║░░░██║░╚██╗████╗██╔╝█████╗░░██║░░░░░",
  "██╗░░██║██║░░░██║░░████╔═████║░██╔══╝░░██║░░░░░",
  "╚█████╔╝╚██████╔╝░░╚██╔╝░╚██╔╝░███████╗███████╗",
  "░╚════╝░░╚═════╝░░░░╚═╝░░░╚═╝░░╚══════╝╚══════╝",
].join("\n");

// নিয়ন নীল রঙ (Render/Railway/GitHub লগে ANSI রঙ দেখায়); বন্ধ করতে NO_COLOR=1
const BLUE = (t) => (process.env.NO_COLOR ? t : `\x1b[1;38;5;39m${t}\x1b[0m`);
const say = (t) => console.log(BLUE(t));
const big = () => BLUE(`\n${BIG}\n   ${NAME}\n`);
const loaded = (i, total, name) => say(`${NAME}  ✔ [${String(i).padStart(3, " ")}/${total}] কমান্ড লোড হয়েছে: ${name}`);
function final(rows) {
  const line = "═".repeat(52);
  say(`\n${line}\n${BIG}\n   ${NAME}\n${line}`);
  for (const [k, v] of rows) say(`  ${k.padEnd(16, " ")}: ${v}`);
  say(`${line}\n`);
}
module.exports = { say, BLUE, NAME, BIG, big, loaded, final };
