(() => {
  const works = window.MBT_WORKS || [];
  const app = document.querySelector('#app');
  const langButton = document.querySelector('#lang-button');
  const homeTemplate = document.querySelector('#home-template');
  let lang = localStorage.getItem('mbt-lang') || 'zh';
  let questions = [];
  let index = 0;
  let correct = 0;
  let answered = false;

  const copy = {
    zh: { eyebrow:'摄影直觉实验 · 娱乐测试版', headline:'你认得出<br />大师之作吗？', lede:'不看名字，不看年代。只看照片，凭直觉作答。', mode:'测试模式', mixed:'混合', mixedHint:'单双题型随机出现', pair:'双图', pairHint:'选出大师作品', single:'单图', singleHint:'判断是否大师作品', length:'题目数量', start:'开始测试', disclaimer:'娱乐测试版。题库与答案保存在网页中，不收集个人信息。', pairPrompt:'哪一张出自摄影大师？', singlePrompt:'这是摄影大师的作品吗？', yes:'是', no:'不是', unsure:'不确定', next:'下一题', finish:'查看成绩', master:'大师作品', artist:'艺术家作品', amateur:'业余作品', unknown:'佚名', result:'你的直觉成绩', resultGood:'你的视觉直觉很敏锐。名字被拿走以后，你仍然能读出作品中的控制与意图。', resultMid:'你已经抓到了一些线索，但名气、风格和“好照片”并不总是一回事。', resultLow:'这正是盲测有趣的地方：大师作品并不总会大声宣布自己。再来一轮，通常会完全不同。', again:'再测一次', live:'当前答对' },
    en: { eyebrow:'A visual intuition experiment · Play edition', headline:'Can you spot<br />a masterwork?', lede:'No names. No dates. Look only at the photograph and trust your eye.', mode:'Test mode', mixed:'Mixed', mixedHint:'Pairs and singles', pair:'Pair', pairHint:'Pick the masterwork', single:'Single', singleHint:'Decide if it is a masterwork', length:'Questions', start:'Start test', disclaimer:'Play edition. The image library and answers are bundled in the page. No personal data is collected.', pairPrompt:'Which photograph is by a master?', singlePrompt:'Is this photograph by a master?', yes:'Yes', no:'No', unsure:'Not sure', next:'Next', finish:'See result', master:'Masterwork', artist:'Artist work', amateur:'Amateur work', unknown:'Unknown', result:'Your intuition score', resultGood:'Your visual intuition is sharp. Even without names, you can read control and intent in the image.', resultMid:'You are catching some of the signals, though fame, style and a “good photograph” are not always the same thing.', resultLow:'That is the pleasure of a blind test: masterworks do not always announce themselves. Another round may feel completely different.', again:'Try again', live:'Correct so far' }
  };
  const t = key => copy[lang][key];
  const shuffle = list => list.map(value => ({value, sort:Math.random()})).sort((a,b)=>a.sort-b.sort).map(x=>x.value);
  const tierName = tier => t(tier === 'master' ? 'master' : tier === 'artist' ? 'artist' : 'amateur');

  function translate(root=document) {
    root.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
    langButton.textContent = lang === 'zh' ? 'EN' : '中文';
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }

  function showHome() {
    questions = []; index = 0; correct = 0; answered = false;
    app.replaceChildren(homeTemplate.content.cloneNode(true));
    translate(app);
    app.querySelector('#start-button').addEventListener('click', start);
  }

  function makeQuestions(mode, count) {
    const masters = shuffle(works.filter(w => w.tier === 'master'));
    const others = shuffle(works.filter(w => w.tier !== 'master'));
    const singles = shuffle(works);
    let mi=0, oi=0, si=0;
    return Array.from({length:count}, (_, i) => {
      const type = mode === 'mixed' ? (i % 2 ? 'single' : 'pair') : mode;
      if (type === 'single') return {type, works:[singles[si++ % singles.length]]};
      const master = masters[mi++ % masters.length];
      const matchIndex = others.findIndex((w, j) => j >= oi && w.style === master.style);
      if (matchIndex >= oi) [others[oi], others[matchIndex]] = [others[matchIndex], others[oi]];
      const other = others[oi++ % others.length];
      return {type, works:Math.random() < .5 ? [master, other] : [other, master]};
    });
  }

  function start() {
    const mode = app.querySelector('[name="mode"]:checked').value;
    const count = Number(app.querySelector('[name="count"]:checked').value);
    questions = makeQuestions(mode, count);
    index = 0; correct = 0; renderQuestion();
  }

  function info(work) {
    const details = [work.title, work.series, work.year].filter(Boolean).join(' · ');
    return `<div class="work-info"><strong>${work.photographer || t('unknown')}</strong>${details ? details + '<br>' : ''}${tierName(work.tier)}</div>`;
  }

  function renderQuestion() {
    answered = false;
    const q = questions[index];
    const pair = q.type === 'pair';
    app.innerHTML = `
      <section class="quiz-head"><div><p class="progress">${String(index+1).padStart(2,'0')} / ${questions.length}</p><h2 class="prompt">${pair ? t('pairPrompt') : t('singlePrompt')}</h2></div><p class="score-live">${t('live')} ${correct}</p></section>
      <section class="images ${pair ? 'pair' : ''}">${q.works.map((w,i)=>`<figure class="photo-card"><img src="${w.image}" alt="" loading="eager" />${pair ? `<span class="badge">${i ? 'B':'A'}</span>`:''}</figure>`).join('')}</section>
      <section class="answers">${pair ? ['A','B',t('unsure')].map((x,i)=>`<button class="answer" data-choice="${i<2?i:'unsure'}">${x}</button>`).join('') : [`<button class="answer" data-choice="yes">${t('yes')}</button>`,`<button class="answer" data-choice="no">${t('no')}</button>`,`<button class="answer" data-choice="unsure">${t('unsure')}</button>`].join('')}</section>
      <section id="reveal"></section>`;
    app.querySelectorAll('.answer').forEach(button => button.addEventListener('click', () => answer(button.dataset.choice)));
  }

  function answer(choice) {
    if (answered) return;
    answered = true;
    const q = questions[index];
    const truth = q.type === 'pair' ? q.works.findIndex(w=>w.tier==='master') : (q.works[0].tier === 'master' ? 'yes' : 'no');
    const isCorrect = String(choice) === String(truth);
    if (isCorrect) correct++;
    app.querySelectorAll('.answer').forEach(button => {
      button.disabled = true;
      if (String(button.dataset.choice) === String(truth)) button.classList.add('correct');
      else if (button.dataset.choice === choice) button.classList.add('wrong');
    });
    const last = index === questions.length - 1;
    app.querySelector('#reveal').innerHTML = `<div class="reveal"><div class="reveal-grid">${q.works.map(info).join('')}</div><button id="next-button" class="primary">${last?t('finish'):t('next')}</button></div>`;
    app.querySelector('#next-button').addEventListener('click', () => { if (last) showResult(); else { index++; renderQuestion(); } });
  }

  function showResult() {
    const percentage = Math.round(correct / questions.length * 100);
    const message = percentage >= 75 ? t('resultGood') : percentage >= 50 ? t('resultMid') : t('resultLow');
    app.innerHTML = `<section class="result"><p class="eyebrow">${t('result')}</p><div class="result-number">${percentage}<span>%</span></div><h2>${correct} / ${questions.length}</h2><p>${message}</p><button id="again-button" class="primary">${t('again')}</button></section>`;
    app.querySelector('#again-button').addEventListener('click', showHome);
  }

  langButton.addEventListener('click', () => {
    lang = lang === 'zh' ? 'en' : 'zh'; localStorage.setItem('mbt-lang', lang);
    if (questions.length) { if (index >= questions.length) showResult(); else renderQuestion(); } else showHome();
  });
  showHome();
})();
