import assert from 'node:assert/strict';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getAreaMetrics, getProjectUnits } from '../../../data/mock-real-estate.ts';
const here = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH ? pathToFileURL(path.join(process.env.PLAYWRIGHT_MODULE_PATH, 'index.mjs')).href : 'playwright');
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),headless:true});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:1100}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.REPORT_PREVIEW_URL || 'http://127.0.0.1:3217',{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'DOM theo phân khu'}).waitFor();
 let backendRequests=0;page.on('request',r=>{if(r.url().includes('/api/'))backendRequests++;});
 for(const project of ['green-avenue','ocean-park','grand-marina']){
  await page.getByLabel('Dự án',{exact:true}).selectOption(project);
  const chart=page.getByRole('region',{name:'Biểu đồ bằng chứng',exact:true});
  const units=getProjectUnits(project);
  const format=value=>value.toLocaleString('vi-VN',{maximumFractionDigits:1});
  for(const mode of ['DOM','Hấp thụ','Giá/m² + DOM']){
   await page.getByRole('button',{name:mode,exact:true}).click();
   assert(!(await page.locator('main').innerText()).includes('NaN'));
   const text=await chart.innerText();
   const selected=mode==='Giá/m² + DOM'?units.filter(row=>row.type==='2PN'):units;
   assert(text.includes(`N = ${format(selected.length)} căn`));
   if(mode==='DOM')for(const metric of getAreaMetrics(project))assert(text.includes(`${format(metric.avgDom)} ngày`));
   if(mode==='Hấp thụ')for(const type of ['Studio','1PN','2PN','3PN']){
    const group=units.filter(row=>row.type===type);
    const row=chart.locator('figure > div').filter({has:page.getByText(type,{exact:true})});
    assert((await row.innerText()).includes(`${format(group.reduce((sum,item)=>sum+item.absorption,0)/group.length)} %`));
   }
   if(mode==='Giá/m² + DOM')for(const metric of getAreaMetrics(project)){
    const group=selected.filter(unit=>unit.area===metric.area);
    const row=chart.locator('figure > div').filter({has:page.getByText(metric.area,{exact:true})});
    assert((await row.innerText()).includes(`${format(group.reduce((sum,item)=>sum+item.pricePerSqm,0)/group.length)} triệu đồng/m²`));
   }
  }
 }
 await page.getByLabel('Dự án',{exact:true}).selectOption('green-avenue');
 for(const width of [375,768,1440]){
  await page.setViewportSize({width,height:1100});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at ${width}`);
  await page.screenshot({path:path.join(here, `report-${width}.png`),fullPage:true});
 }
 await page.getByRole('button',{name:'Gửi duyệt',exact:true}).click();
 assert(await page.getByRole('button',{name:'Phê duyệt báo cáo',exact:true}).isDisabled());
 const triggers=page.getByRole('button',{name:'Xem bằng chứng',exact:true});
 const expectedEvidence=[
  ['Chỉ số Riverside'],
  ['Hấp thụ nhóm Studio','Hấp thụ nhóm 1PN','Hấp thụ nhóm 2PN','Hấp thụ nhóm 3PN'],
  ['Chỉ số Riverside','Chỉ số Garden','Chỉ số Parkside'],
 ];
 for(let i=0;i<3;i++){
  await triggers.nth(i).click();
  const dialog=page.getByRole('dialog');
  await dialog.waitFor({state:'visible'});
  const dialogText=await dialog.innerText();
  for(const title of expectedEvidence[i])assert(dialogText.includes(title),`Claim ${i + 1} thiếu evidence ${title}`);
  assert(dialogText.includes('Phép tính'));
  assert(dialogText.includes('Mẫu & phạm vi'));
  assert(dialogText.includes('Chuỗi truy vết'));
  assert.equal(await page.locator(':focus').getAttribute('aria-label'),'Đóng bằng chứng');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.locator(':focus').innerText(),'Xác nhận đã duyệt claim');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').innerText(),'Đóng');
  if(i===0){
   await dialog.getByRole('button',{name:'Mở dữ liệu nguồn',exact:true}).click();
   await page.getByText('Đã chọn dữ liệu nguồn: area-Riverside',{exact:true}).waitFor();
  }
  await dialog.getByRole('button',{name:'Xác nhận đã duyệt claim'}).click();
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'hidden'});
  assert.equal(await page.locator(':focus').innerText(),'Xem bằng chứng');
 }
 assert(await page.getByRole('button',{name:'Phê duyệt báo cáo',exact:true}).isEnabled());
 await page.getByRole('button',{name:'Phê duyệt báo cáo',exact:true}).click();
 await page.getByRole('button',{name:'Export PDF mô phỏng',exact:true}).click();
 assert(await page.getByRole('button',{name:'Đang export…',exact:true}).isDisabled());
 await page.getByText('Export mô phỏng thành công · Đã phê duyệt',{exact:true}).waitFor();
 await page.getByRole('button',{name:'QA: expire',exact:true}).click();
 await page.getByRole('button',{name:'Tạo lại link mô phỏng',exact:true}).click();
 await page.getByText('Export mô phỏng thành công · Đã phê duyệt',{exact:true}).waitFor();
 await page.getByLabel('Scenario',{exact:true}).selectOption('export-error');
 await page.getByRole('button',{name:'Export PDF mô phỏng',exact:true}).click();
 await page.getByRole('button',{name:'Thử export lại',exact:true}).waitFor();
 await page.getByRole('button',{name:'Thử export lại',exact:true}).click();
 await page.getByText('Export mô phỏng thành công · Bản nháp',{exact:true}).waitFor();
 await page.getByLabel('Scenario',{exact:true}).selectOption('pending');
 assert(await page.getByRole('button',{name:'Yêu cầu chỉnh sửa',exact:true}).isDisabled());
 await page.getByLabel('Lý do yêu cầu chỉnh sửa',{exact:true}).fill('Bổ sung nguồn');
 await page.getByRole('button',{name:'Yêu cầu chỉnh sửa',exact:true}).click();
 await page.getByText('Yêu cầu chỉnh sửa: Bổ sung nguồn',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Hoàn tất chỉnh sửa',exact:true}).click();
 await page.getByRole('button',{name:'Gửi duyệt',exact:true}).waitFor();
 for(const scenario of ['loading','empty','partial','error','no-2pn','missing','missing-section']){
  await page.getByLabel('Scenario',{exact:true}).selectOption(scenario);
  if(scenario==='no-2pn'){
   await page.getByRole('button',{name:'Giá/m² + DOM',exact:true}).click();
   await page.getByText('Không có dữ liệu cho biểu đồ này.',{exact:true}).waitFor();
  }
  if(scenario==='missing'){
   await page.getByRole('button',{name:'Gửi duyệt',exact:true}).click();
   await page.getByRole('button',{name:'Xem bằng chứng',exact:true}).first().click();
   await page.getByText('Không tìm thấy evidence unresolved. Chưa đủ bằng chứng để duyệt claim.',{exact:true}).waitFor();
   assert(await page.getByRole('button',{name:'Xác nhận đã duyệt claim',exact:true}).isDisabled());
   await page.keyboard.press('Escape');
  }
  assert(!(await page.locator('main').innerText()).includes('NaN'));
 }
 await page.getByLabel('Scenario',{exact:true}).selectOption('ready');
 await page.getByRole('button',{name:'Tóm tắt 1 trang',exact:true}).click();
 await page.emulateMedia({media:'print'});
 await page.locator('section[aria-label="Biểu đồ bằng chứng"]').evaluate(el=>el.remove());
 await page.locator('main > div').first().evaluate(el=>el.remove());
 await page.pdf({path:path.join(tmpdir(), 'son-report-summary-qa.pdf'),format:'A4',margin:{top:'15mm',bottom:'15mm',left:'15mm',right:'15mm'}});
 assert.deepEqual(errors,[]);
 assert.equal(backendRequests,0);
 console.log('PASS: 3 projects; 3 charts; 375/768/1440 px; review, evidence, focus, export and error states.');
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
