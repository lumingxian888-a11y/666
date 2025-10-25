let activeCell=null, firstDigit=null, locked=false, bets=[];

(function buildEditor(){
  const editor=document.getElementById('editor');
  for(let i=0;i<9;i++){
    const inp=document.createElement('input');
    inp.readOnly=true; inp.style.color='red';
    inp.addEventListener('click',()=>{
      if(locked && activeCell!==inp) return;
      activeCell=inp; firstDigit=null;
    });
    editor.appendChild(inp);
  }
  buildNumpad();
})();

function buildNumpad(){
  const pad=document.getElementById('numpad');
  pad.innerHTML='';
  const layout = [
    [0,1,2,3,'X','□'],
    [4,5,6,7,8,9]
  ];
  layout.forEach(row=>{
    const rowDiv=document.createElement('div');
    row.forEach(v=>{
      const btn=document.createElement('button');
      btn.textContent=v;
      btn.addEventListener('click',()=>handleKey(v));
      rowDiv.appendChild(btn);
    });
    pad.appendChild(rowDiv);
  });
}

function handleKey(v){
  if(!activeCell) return;
  if(v === 'X'){
    activeCell.value=''; activeCell.style.color='red';
    activeCell=null; firstDigit=null; locked=false;
    updateBets();
    return;
  }
  if(v === '□') return;
  const digit = parseInt(v);
  if(firstDigit === null){
    if(digit>=0 && digit<=3){
      firstDigit = digit;
      activeCell.value = String(digit);
      activeCell.style.color='red';
      locked = true;
    }
    return;
  }
  const num = firstDigit*10 + digit;
  if(num>=1 && num<=39){
    const exists = Array.from(document.querySelectorAll('#editor input'))
      .some(inp => inp!==activeCell && inp.value === String(num).padStart(2,'0'));
    if(!exists){
      activeCell.value = String(num).padStart(2,'0');
      activeCell.style.color='black';
      activeCell=null; firstDigit=null; locked=false;
      updateBets();
      return;
    }
  }
  flashError(activeCell);
  activeCell.value = String(firstDigit);
  activeCell.style.color='red';
  firstDigit = null;
}

function flashError(cell){
  if(!cell) return;
  cell.classList.add('errorFlash');
  setTimeout(()=>cell.classList.remove('errorFlash'),300);
}

document.getElementById('clearBtn').addEventListener('click',()=>{
  document.querySelectorAll('#editor input').forEach(i=>{ i.value=''; i.style.color='red'; i.classList.remove('errorFlash'); });
  activeCell=null; firstDigit=null; locked=false; bets=[]; colorDraws();
});

function updateBets(){
  bets = Array.from(document.querySelectorAll('#editor input')).map(i=>i.value).filter(v=>v!=='');
  console.log('投注清單', bets);
  colorDraws();
}

function parseRow(tr){
  const cells = tr.cells;
  const dateRe = /^\d{4}[-\/]\d{2}[-\/]\d{2}$/;
  const first = cells[0] ? cells[0].textContent.trim() : '';
  if(cells.length>=3 && dateRe.test(first)){
    if(cells.length === 3){
      const nums = cells[2].textContent.trim().split(/\s+/).filter(Boolean);
      return { hasDate:true, date:first, numbers:nums, singleCell:true, numStartIndex:2 };
    } else {
      const nums = [];
      for(let i=2;i<cells.length;i++){ const t=cells[i].textContent.trim(); if(t) nums.push(t); }
      return { hasDate:true, date:first, numbers:nums, singleCell:false, numStartIndex:2 };
    }
  }
  const text = tr.textContent.trim();
  const nums = text.split(/\s+/).filter(s=>/^\d+$/.test(s));
  return { hasDate:false, date:null, numbers:nums, singleCell:true, numStartIndex:0 };
}

function colorDraws(){
  document.querySelectorAll('#draws tbody tr').forEach((tr,idx)=>{
    const parsed = parseRow(tr);
    const nums = parsed.numbers.map(n=>(''+n).replace(/\D/g,'').padStart(2,'0')).filter(Boolean);
    const matched = bets.filter(b=>nums.includes(b));
    if(parsed.singleCell && parsed.hasDate){
      const out = nums.map(n=>{
        if(bets.includes(n)){
          if(matched.length>=3) return `<span class="hit3">${n}</span>`;
          if(matched.length==2) return `<span class="hit2">${n}</span>`;
          return `<span class="hit1">${n}</span>`;
        }
        return n;
      }).join(' ');
      if(tr.cells[parsed.numStartIndex]) tr.cells[parsed.numStartIndex].innerHTML = out;
    } else {
      for(let i=0;i<nums.length;i++){
        const ci = parsed.numStartIndex + i;
        const n = nums[i];
        if(tr.cells[ci]){
          if(bets.includes(n)){
            if(matched.length>=3) tr.cells[ci].innerHTML = `<span class="hit3">${n}</span>`;
            else if(matched.length==2) tr.cells[ci].innerHTML = `<span class="hit2">${n}</span>`;
            else tr.cells[ci].innerHTML = `<span class="hit1">${n}</span>`;
          } else tr.cells[ci].innerHTML = n;
        }
      }
    }
  });
}

function filterByDate(){
  const start = document.getElementById('startDate').value;
  if(!start) return;
  const s = new Date(start);
  const today = new Date();
  document.querySelectorAll('#draws tbody tr').forEach(tr=>{
    const parsed = parseRow(tr);
    if(!parsed.hasDate){ tr.style.display='none'; return; }
    const d = new Date(parsed.date.replace(/\//g,'-'));
    tr.style.display = (d>=s && d<=today) ? '' : 'none';
  });
}
document.getElementById('filterBtn').addEventListener('click', filterByDate);
document.getElementById('showAllBtn').addEventListener('click', ()=>document.querySelectorAll('#draws tbody tr').forEach(tr=>tr.style.display=''));
window.addEventListener('load', ()=>{ colorDraws(); });
