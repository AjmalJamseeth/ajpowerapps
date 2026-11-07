// Usage: node tools/protect-app.js <source.html> <output.html> lock <APPNAME>
// Needs: npm i -D javascript-obfuscator   Keep the readable source OUTSIDE this repository.
// Protects a single-file HTML app: copyright notice, watermark, obfuscation of the app's own
// scripts (third-party libraries carrying a licence header are left intact) and a host lock.
// Usage: node build2.js <src.html> <out.html> <lock|nolock> <appName>
const fs=require('fs'); const JO=require('javascript-obfuscator'); const crypto=require('crypto');
const [src,out,lock,app='APP']=process.argv.slice(2);
let html=fs.readFileSync(src,'utf8');
const wm='AJPA-'+app.toUpperCase()+'-'+crypto.createHash('sha256').update(html).digest('hex').slice(0,16).toUpperCase();
const isLib=(attrs,body)=>/type="(?!text\/javascript)[^"]*"/i.test(attrs)||/@licstart/.test(body.slice(0,800))||/^\s*\/\*\s*PDF\.js/.test(body);
const guard = lock==='lock' ? `(function(){var h=String(location.hostname||'').toLowerCase();if(!(h==='ajpowerapps.com'||/\\.ajpowerapps\\.com$/.test(h))){try{if(!window.__AJ_BLOCKED__){window.__AJ_BLOCKED__=1;document.documentElement.innerHTML='<body style="background:#0b1020"><div style="font:16px system-ui,sans-serif;padding:48px;max-width:640px;margin:auto;color:#ddd"><h2>This application runs only on ajpowerapps.com</h2><p>This copy is not authorised. Open the official version at <a style="color:#22d3ee" href="https://www.ajpowerapps.com/">www.ajpowerapps.com</a>.</p><p style="opacity:.6;font-size:12px">&copy; 2026 Ajmal Jamseeth, AJapps. All rights reserved.</p></div></body>';}}catch(e){}throw new Error('Unauthorised host');}})();\n` : '';
const opts={compact:true,simplify:true,identifierNamesGenerator:'hexadecimal',renameGlobals:false,stringArray:true,stringArrayEncoding:['base64'],stringArrayThreshold:1,stringArrayRotate:true,stringArrayShuffle:true,splitStrings:false,controlFlowFlattening:false,deadCodeInjection:false,selfDefending:false,transformObjectKeys:false,unicodeEscapeSequence:false,target:'browser',seed:11};
if(lock==='lock'){opts.domainLock=['ajpowerapps.com','.ajpowerapps.com'];opts.domainLockRedirectUrl='https://www.ajpowerapps.com/';}
let n=0,skipped=0,first=true;
html=html.replace(/<script([^>]*)>([\s\S]*?)<\/script>/g,(all,attrs,body)=>{
  if(/\bsrc=/.test(attrs)||isLib(attrs,body)||!body.trim()){skipped++;return all;}
  let code=(first?`/* (c) 2026 Ajmal Jamseeth, AJapps (ajpowerapps.com). All rights reserved. */\nwindow.__AJAPPS_BUILD__=${JSON.stringify(wm)};\n`:'')+guard+body;
  first=false; n++;
  const ob=JO.obfuscate(code,opts).getObfuscatedCode().replace(/<\/(script)/gi,'<\\/$1').replace(/<!--/g,'<\\!--');
  return '<script'+attrs+'>'+ob+'</script>';
});
html=html.replace(/<html([^>]*)>/i,s=>s+`\n<!-- ${app} (c) 2026 Ajmal Jamseeth, AJapps (ajpowerapps.com). All rights reserved. Copying, redistribution or modification of this software is prohibited without written permission. Build ${wm} -->`);
fs.writeFileSync(out,html); console.log('obfuscated',n,'left intact',skipped,'watermark',wm,'size',(html.length/1048576).toFixed(2),'MB');
