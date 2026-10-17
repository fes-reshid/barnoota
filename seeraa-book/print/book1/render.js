const { chromium } = require('playwright');
const DIR = require('path').dirname(require('path').resolve(__filename));
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:900,height:1180}});
  await p.goto('file://'+DIR+'/book.html',{waitUntil:'networkidle'});
  await p.evaluate(()=>document.fonts.ready);
  await p.waitForTimeout(2500);
  await p.pdf({
    path: DIR+'/Seeraa_Quest_Book_1_Interior_KDP.pdf',
    width:'8.625in', height:'11.25in',
    printBackground:true, margin:{top:0,right:0,bottom:0,left:0},
    preferCSSPageSize:false, scale:1
  });
  await b.close(); console.log('pdf written');
})();
