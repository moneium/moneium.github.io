(() => {
  const works = window.MBT_WORKS || [];
  const app = document.querySelector('#app');
  const counts = [10, 15, 20, 25, 30, 40, 50];
  const confidenceValues = [50, 60, 70, 80, 90, 100];
  let lang = localStorage.getItem('mbt-lang') || 'zh';
  let mode = 'mixed';
  let count = 15;
  let questions = [];
  let index = 0;
  let answers = [];
  let selectedAnswer = null;
  let selectedConfidence = null;
  let revealed = false;

  const zh = () => lang === 'zh';
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const shuffle = list => list.map(value => ({value, sort:Math.random()})).sort((a,b)=>a.sort-b.sort).map(item=>item.value);
  const master = work => work.tier === 'master';
  const tierLabel = tier => tier === 'master' ? (zh() ? '摄影大师 / MASTER' : 'MASTER PHOTOGRAPHER') : tier === 'artist' ? (zh() ? '优秀艺术家 / ARTIST' : 'ESTABLISHED ARTIST') : (zh() ? '业余爱好者' : 'AMATEUR');

  function header(testActive=false) {
    return `<header class="site-header ${testActive?'site-header--quiet':''}">
      <button class="wordmark wordmark-button" id="home-button" type="button">MASTER BLIND TEST <span class="demo-tag">DEMO</span></button>
      <div class="header-actions">${testActive?`<button class="header-exit" id="exit-button" type="button">${zh()?'退出':'Exit test'}</button>`:''}<button class="language-switcher" id="language-button" type="button">${zh()?'EN':'中'}</button></div>
    </header>`;
  }

  function bindHeader() {
    document.querySelector('#home-button')?.addEventListener('click', showHome);
    document.querySelector('#exit-button')?.addEventListener('click', showHome);
    document.querySelector('#language-button')?.addEventListener('click', () => {
      lang = zh() ? 'en' : 'zh';
      localStorage.setItem('mbt-lang', lang);
      document.documentElement.lang = zh() ? 'zh-CN' : 'en';
      if (!questions.length) showHome(); else if (index >= questions.length) showResults(); else renderQuestion();
    });
  }

  function modeData() {
    return zh() ? [
      {id:'pair',number:'01',title:'双图',summary:'大师 / 非大师二选一',description:'两张照片并置，找出其中的大师作品。'},
      {id:'single',number:'02',title:'单图',summary:'判断是否为大师作品',description:'只看一张照片，判断它是否出自大师之手。'},
      {id:'mixed',number:'03',title:'综合',summary:'两种题型随机出现',description:'双图与单图交替出现，完成一次完整辨识。'}
    ] : [
      {id:'pair',number:'01',title:'Pair',summary:'Master / non-master',description:'Compare two photographs and choose the established master.'},
      {id:'single',number:'02',title:'Single',summary:"Is it a master's work?",description:'Judge one photograph without a comparison image.'},
      {id:'mixed',number:'03',title:'Mixed',summary:'Both formats at random',description:'Combine pair and single-image questions in one session.'}
    ];
  }

  function showHome() {
    questions=[]; index=0; answers=[]; revealed=false;
    const modes=modeData();
    const selected=modes.find(item=>item.id===mode) || modes[2];
    const countIndex=counts.indexOf(count);
    app.innerHTML=`<main class="home-page">${header()}
      <section class="home-hero" aria-labelledby="home-title">
        <div class="hero-statement">
          ${zh()?'':'<p class="kicker">AN EXPERIMENT IN VISUAL RECOGNITION</p>'}
          <h1 id="home-title">${zh()?'<span>大师作品盲测：</span><br><em>隐去一切信息，<br>你还认得出大师吗？</em>':'Can You Recognize a Master <em>Without the Name?</em>'}</h1>
          <p class="hero-deck">${zh()?'隐去姓名、年代与名望，只凭感知和直觉作出判断。':"Remove the artist's name, museum label and reputation. Can you still recognize the work?"}</p>
        </div>
        <aside class="test-launcher" aria-labelledby="mode-heading">
          <div class="launcher-heading"><p class="kicker ${zh()?'launcher-title-zh':''}" id="mode-heading">${zh()?'选择题型':'CHOOSE A FORMAT'}</p>${zh()?'':'<h2>Start looking.</h2>'}</div>
          <div class="mode-list" role="group">${modes.map(item=>`<button type="button" class="mode-row ${mode===item.id?'mode-row--active':''}" data-mode="${item.id}" aria-pressed="${mode===item.id}"><span class="mode-number">${item.number}</span><span class="mode-title">${item.title}</span><small class="mode-summary">${item.summary}</small></button>`).join('')}</div>
          <p class="selected-description"><strong>${zh()?`${selected.title}题。`:`${selected.title} Test.`}</strong> ${selected.description}</p>
          <div class="question-count-control"><div><label for="question-count">${zh()?'题目数量':'Questions'}</label><strong id="count-value">${count}</strong></div><input id="question-count" type="range" min="0" max="6" step="1" value="${countIndex}" style="--range-progress:${countIndex/6*100}%"><div class="question-count-ticks" aria-hidden="true">${counts.map(value=>`<span>${value}</span>`).join('')}</div></div>
          <ul class="test-facts"><li id="fact-count">${count} ${zh()?'题':'questions'}</li><li id="fact-mode">${selected.title}${zh()?'模式':' mode'}</li></ul>
          <button class="start-button" id="start-button" type="button">${zh()?'开始测试':`Start ${selected.title} Test`} <span aria-hidden="true">→</span></button>
        </aside>
      </section>
      <section class="study-note"><p class="kicker">${zh()?'这项测试在测什么':'ABOUT THE STUDY'}</p><div>${zh()?'':'<h2>This is not a test of good versus bad.</h2>'}<p>${zh()?'这里的“大师”，指在博物馆收藏、重要出版与摄影史研究中已有公认地位的摄影家。我们想知道：当姓名与背景都被隐去，他们的作品是否仍然可辨。':'“Established master” refers to photographers with a documented historical position across museums, major publications and photographic scholarship. The experiment asks whether that position remains legible when the label disappears.'}</p>${zh()?'<p>本测试仅供娱乐与观察，不代表对任何艺术家、作品或艺术价值的判断与质疑。</p>':''}</div></section>
    </main>`;
    bindHeader();
    app.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.mode;showHome();}));
    app.querySelector('#question-count').addEventListener('input',event=>{count=counts[Number(event.target.value)];showHome();});
    app.querySelector('#start-button').addEventListener('click',startTest);
  }

  function buildQuestions() {
    const masters=shuffle(works.filter(master));
    const others=shuffle(works.filter(work=>!master(work)));
    const singles=shuffle(works);
    let mi=0,oi=0,si=0;
    return Array.from({length:count},(_,i)=>{
      const type=mode==='mixed'?(i%2===0?'pair':'single'):mode;
      if(type==='single') return {type,works:[singles[si++%singles.length]]};
      const left=masters[mi++%masters.length];
      let match=others.findIndex((work,j)=>j>=oi&&work.style===left.style);
      if(match<oi) match=oi%others.length;
      if(match!==oi&&oi<others.length) [others[oi],others[match]]=[others[match],others[oi]];
      const right=others[oi++%others.length];
      return {type,works:Math.random()<.5?[left,right]:[right,left]};
    });
  }

  function startTest(){questions=buildQuestions();index=0;answers=[];renderQuestion();}
  function answerOptions(question){return question.type==='pair'?[['A',zh()?'A':'Image A'],['B',zh()?'B':'Image B'],['not_sure',zh()?'不确定':'Not sure']]:[['yes',zh()?'是':'Yes'],['no',zh()?'不是':'No'],['not_sure',zh()?'不确定':'Not sure']];}
  function truth(question){return question.type==='pair'?(master(question.works[0])?'A':'B'):(master(question.works[0])?'yes':'no');}
  function choiceLabel(question,value){if(value==='not_sure')return zh()?'不确定':'Not sure';if(question.type==='pair')return zh()?`图片 ${value}`:`Image ${value}`;return value==='yes'?(zh()?'大师作品':'Master work'):(zh()?'非大师作品':'Non-master work');}

  function renderImage(work,label){return `<figure><div class="work-image-frame"><img class="work-image" src="${work.image}" alt="" /></div>${label?`<figcaption>${label}</figcaption>`:''}</figure>`;}
  function renderQuestion(){
    selectedAnswer=null;selectedConfidence=null;revealed=false;
    const question=questions[index];
    app.innerHTML=`<main class="test-page">${header(true)}<div class="test-workspace">
      <section class="question-stage question-stage--${question.type}">${question.type==='pair'?`<div class="pair-works">${renderImage(question.works[0],'A')}${renderImage(question.works[1],'B')}</div>`:`<div class="single-work">${renderImage(question.works[0])}</div>`}</section>
      <section class="answer-panel"><div class="question-copy"><span class="panel-index">${String(index+1).padStart(2,'0')}<small>/ ${questions.length}</small></span><div><h1>${question.type==='pair'?(zh()?'两张照片中，哪一张出自摄影大师？':'Which image is by an established master photographer?'):(zh()?'这张照片出自摄影大师吗？':'Is this photograph by an established master photographer?')}</h1><p>${zh()?'这里的“大师”，指其摄影史地位受到博物馆收藏、重要出版与学术研究共同认可的摄影家。':'“Established” means a documented position in museum collections, major publications and photographic scholarship—not simply a good photograph.'}</p></div></div><div id="response-area"></div></section>
    </div></main>`;
    bindHeader();renderControls();
  }

  function renderControls(){
    const question=questions[index];
    const area=app.querySelector('#response-area');
    if(revealed){area.innerHTML=renderReveal(question);area.querySelector('#next-button').addEventListener('click',()=>{if(index===questions.length-1){index=questions.length;showResults();}else{index++;renderQuestion();}});return;}
    area.innerHTML=`<div class="response-controls"><div class="answer-group" role="group">${answerOptions(question).map(([value,label])=>`<button type="button" data-answer="${value}" class="${selectedAnswer===value?'selected':''}">${label}</button>`).join('')}</div>${selectedAnswer&&selectedAnswer!=='not_sure'?`<fieldset class="confidence-group visible"><legend>${zh()?'你有几分把握？':'How confident are you in that answer?'}</legend><div>${confidenceValues.map(value=>`<button type="button" data-confidence="${value}" class="${selectedConfidence===value?'selected':''}">${value}<small>%</small></button>`).join('')}</div></fieldset>`:''}<button class="submit-answer" id="submit-button" type="button" ${!selectedAnswer||(selectedAnswer!=='not_sure'&&!selectedConfidence)?'disabled':''}>${zh()?'确认答案':'Submit Answer'}</button></div>`;
    area.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{selectedAnswer=button.dataset.answer;selectedConfidence=null;renderControls();}));
    area.querySelectorAll('[data-confidence]').forEach(button=>button.addEventListener('click',()=>{selectedConfidence=Number(button.dataset.confidence);renderControls();}));
    area.querySelector('#submit-button').addEventListener('click',()=>{const correct=selectedAnswer===truth(question);answers.push({correct,confidence:selectedAnswer==='not_sure'?null:selectedConfidence,notSure:selectedAnswer==='not_sure',type:question.type});revealed=true;renderControls();});
  }

  function metadata(work,label=''){
    if(work.tier==='amateur')return `<div class="metadata-block metadata-block--amateur">${label?`<span class="metadata-label">${label}</span>`:''}<span class="classification classification--amateur">${tierLabel(work.tier)}</span></div>`;
    return `<div class="metadata-block">${label?`<span class="metadata-label">${label}</span>`:''}<strong>${escapeHtml(work.photographer||'—')}</strong>${work.tier==='master'&&work.series?`<span class="metadata-series"><em>${escapeHtml(work.series)}</em></span>`:''}${work.tier==='master'?`<span class="metadata-date">${escapeHtml(work.year||(zh()?'年份不详':'Date unknown'))}</span>`:''}<span class="classification classification--${work.tier}">${tierLabel(work.tier)}</span></div>`;
  }
  function renderReveal(question){
    const correct=selectedAnswer===truth(question);
    return `<div class="reveal-panel ${correct?'reveal-panel--correct':'reveal-panel--incorrect'}"><div class="reveal-verdict"><span>${correct?(zh()?'判断正确':'Correct'):(zh()?'判断有误':'Incorrect')}</span><div class="reveal-verdict-facts"><p><small>${zh()?'你的选择':'Your choice'}</small><strong>${choiceLabel(question,selectedAnswer)}</strong></p><p><small>${zh()?'正确答案':'Correct answer'}</small><strong>${choiceLabel(question,truth(question))}</strong></p></div></div><div class="reveal-details">${question.works.map((work,i)=>metadata(work,question.type==='pair'?(i?'B':'A'):'')).join('')}</div><button class="next-button" id="next-button" type="button">${index===questions.length-1?(zh()?'查看成绩':'View Results'):(zh()?'继续':'Next Question')}<span aria-hidden="true">→</span></button></div>`;
  }

  function narrative(score){if(zh()){if(score===100)return['完全准确','这一轮的所有判断都答对了。'];if(score>=80)return['非常准确','这一轮绝大多数判断都答对了。'];if(score>=60)return['大致准确','这一轮多数判断正确，但仍有一些误判。'];if(score>=40)return['准确度不足','这一轮有一些判断是对的，但整体表现还不够稳定。'];if(score>0)return['准确度较低','这一轮只有少数判断答对了。'];return['完全不准确','这一轮没有判断正确。'];}if(score===100)return['Completely accurate','Every judgment in this session was correct.'];if(score>=80)return['Highly accurate','Nearly every judgment in this session was correct.'];if(score>=60)return['Mostly accurate','Most judgments were correct, with a few misses.'];if(score>=40)return['Not accurate enough','Correct judgments did not yet form a consistent advantage.'];if(score>0)return['Low accuracy','Only a small share of judgments were correct.'];return['Completely inaccurate','No judgment in this session was correct.'];}
  function showResults(){
    const right=answers.filter(item=>item.correct).length;
    const unsure=answers.filter(item=>item.notSure).length;
    const wrong=answers.length-right-unsure;
    const score=Math.round(right/answers.length*100);
    const committed=answers.filter(item=>item.confidence!==null);
    const avg=committed.length?Math.round(committed.reduce((sum,item)=>sum+item.confidence,0)/committed.length):null;
    const [headline,body]=narrative(score);
    const modeLabel=zh()?({pair:'双图模式',single:'单图模式',mixed:'综合模式'})[mode]:({pair:'Pair test',single:'Single test',mixed:'Mixed test'})[mode];
    app.innerHTML=`<main class="report">${header()}<header class="report-hero"><div class="report-intro"><p class="kicker">${zh()?'本轮结论':'SESSION VERDICT'}</p><h1>${headline}</h1><p>${body}</p><div class="report-runline"><span>${modeLabel}</span><span>${answers.length} ${zh()?'道题':'questions'}</span></div></div><div class="report-score"><p>${zh()?'总辨识率':'OVERALL RECOGNITION'}</p><div><strong>${score}</strong><span>%</span></div><i><b style="width:${score}%"></b></i><small>${zh()?`${answers.length} 题中答对 ${right} 题，答错 ${wrong} 题，选择“不确定” ${unsure} 题`:`${right} correct out of ${answers.length}`}</small></div></header><section class="report-ledger"><div><span>${zh()?'答对数量:':'Correct'}</span><strong>${right}</strong><small>${zh()?`共 ${answers.length} 题`:`of ${answers.length}`}</small></div><div><span>${zh()?'答错数量:':'Incorrect'}</span><strong>${wrong}</strong><small>&nbsp;</small></div><div><span>${zh()?'不确定数量:':'Not sure'}</span><strong>${unsure}</strong><small>${zh()?'（未计入把握度）':'excluded from confidence'}</small></div><div><span>${zh()?'平均把握:':'Average confidence'}</span><strong>${avg===null?'—':`${avg}%`}</strong><small>${zh()?'（不含“不确定”）':'committed answers only'}</small></div></section><footer class="report-footer"><div><p class="kicker">${zh()?'再看一次':'LOOK AGAIN'}</p><h2>${zh()?`我在摄影大师盲测中答对了 ${score}%。`:`I scored ${score}% on Master Blind Test.`}</h2></div><div><button id="restart-button" type="button">${zh()?'再试一轮':'Take another test'} <span>→</span></button></div></footer></main>`;
    bindHeader();app.querySelector('#restart-button').addEventListener('click',showHome);
  }

  document.documentElement.lang=zh()?'zh-CN':'en';
  showHome();
})();
