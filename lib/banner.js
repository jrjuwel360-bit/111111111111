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

const big = () => `\n${BIG}\n   ${NAME}\n`;
const loaded = (i, total, name) => console.log(`${NAME}  ✔ [${String(i).padStart(3, " ")}/${total}] কমান্ড লোড হয়েছে: ${name}`);
function final(rows) {
  const line = "═".repeat(52);
  console.log(`\n${line}\n${BIG}\n   ${NAME}\n${line}`);
  for (const [k, v] of rows) console.log(`  ${k.padEnd(16, " ")}: ${v}`);
  console.log(`${line}\n`);
}
module.exports = { NAME, BIG, big, loaded, final };
