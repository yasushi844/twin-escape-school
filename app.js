document.addEventListener('DOMContentLoaded', () => {
  // --- 画面要素の取得 ---
  const titleScreen = document.getElementById('title-screen');
  const selectionScreen = document.getElementById('selection-screen');
  const playerAScreen = document.getElementById('player-a-screen');
  const playerBScreen = document.getElementById('player-b-screen');

  // --- ボタン・リンク要素の取得 ---
  const btnStartGame = document.getElementById('btn-start-game');
  const routePlayerA = document.getElementById('route-player-a');
  const routePlayerB = document.getElementById('route-player-b');

  // --- 入力・送信ボタンの取得 ---
  const inputCodeA = document.getElementById('input-code-a');
  const btnSubmitA = document.getElementById('btn-submit-a');
  const inputCodeB = document.getElementById('input-code-b');
  const btnSubmitB = document.getElementById('btn-submit-b');

  // --- カスタムダイアログ（非ブロッキングモーダル）の取得と制御 ---
  const customAlert = document.getElementById('custom-alert');
  const customAlertMessage = document.getElementById('custom-alert-message');
  const customAlertClose = document.getElementById('custom-alert-close');
  const customAlertBtn = document.getElementById('custom-alert-btn');
  let currentAlertCallback = null;

  function showCustomAlert(message, callback = null) {
    if (!customAlert || !customAlertMessage) {
      // DOMがない場合のフォールバック
      alert(message);
      if (callback) callback();
      return;
    }
    customAlertMessage.textContent = message;
    currentAlertCallback = callback;
    customAlert.classList.add('show');
  }

  function closeCustomAlert() {
    if (customAlert) {
      customAlert.classList.remove('show');
    }
    if (currentAlertCallback) {
      const cb = currentAlertCallback;
      currentAlertCallback = null;
      cb();
    }
  }

  if (customAlertClose) {
    customAlertClose.addEventListener('click', closeCustomAlert);
  }
  if (customAlertBtn) {
    customAlertBtn.addEventListener('click', closeCustomAlert);
  }
  if (customAlert) {
    customAlert.addEventListener('click', (e) => {
      if (e.target === customAlert) {
        closeCustomAlert();
      }
    });
  }

  // --- ゲーム進行状態 ---
  let unlockedFloorA = 3; // 西校舎の進行状態
  let unlockedFloorB = 3; // 東校舎の進行状態
  let currentRoomA = '3-1';
  let currentRoomB = 'music';

  // 各部屋の解除状態を記録
  const clearedRooms = {
    'a-3-1': false, 'a-3-2': false, 'a-3-3': false, 'a-stairs-3f': false,
    'a-2-1': false, 'a-2-2': false, 'a-2-3': false, 'a-stairs-2f': false,
    'a-1-1': false, 'a-1-2': false, 'a-1-3': false, 'a-entrance': false,
    'a-gate1': false, 'a-gate2': false, 'a-gate3': false,

    'b-music': false, 'b-art': false, 'b-prep': false, 'b-stairs-3f': false,
    'b-science': false, 'b-cooking': false, 'b-meeting': false, 'b-stairs-2f': false,
    'b-staff': false, 'b-principal': false, 'b-infirmary': false, 'b-janitor': false,
    'b-gate1': false, 'b-gate2': false, 'b-gate3': false
  };

  // --- 画面遷移 of 共通処理 ---
  function switchScreen(fromScreen, toScreen) {
    fromScreen.style.opacity = '0';
    
    setTimeout(() => {
      fromScreen.classList.remove('active');
      toScreen.classList.add('active');
      requestAnimationFrame(() => {
        toScreen.style.opacity = '1';
      });
    }, 500);
  }

  // --- 部屋の名前の定義（日本語表示用） ---
  const roomNamesWest = {
    '3-1': '3-1', '3-2': '3-2', '3-3': '3-3', 'stairs-3f': '階段',
    '2-1': '2-1', '2-2': '2-2', '2-3': '2-3', 'stairs-2f': '階段',
    '1-1': '1-1', '1-2': '1-2', '1-3': '1-3', 'entrance': '扉',
    'gate1': '玄関前', 'gate2': '玄関', 'gate3': '正門'
  };

  const roomNamesEast = {
    'music': '音楽室', 'art': '美術室', 'prep': '準備室', 'stairs-3f': '階段',
    'science': '理科室', 'cooking': '家庭科', 'meeting': '会議室', 'stairs-2f': '階段',
    'staff': '職員室', 'principal': '校長室', 'infirmary': '保健室', 'janitor': '扉',
    'gate1': '玄関前', 'gate2': '玄関', 'gate3': '正門'
  };

  // --- 部屋データ定義 ---
  const roomsWest = {
    '3-1': {
      title: '西校舎 3年1組 ／ 誰もいない教室',
      icon: '📝',
      clueLabel: '黒板に書かれた奇妙なメッセージ：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-blue)',
      instruction: '黒板に不気味なメッセージが残されている。「元素のアルファベット文字数」？<br>音楽室（Player B）にいる相方に、そちらの状況を確認してみよう。',
      showControl: true,
      code: '0',
      successMsg: '【ロック解除！】\n教卓の引き出しが開いた！中からメモが見つかった：\n「音楽室の鍵のコードは【0】だ」'
    },
    '3-2': {
      title: '西校舎 3年2組 ／ 散らばったプリント',
      icon: '📄',
      clueLabel: '床に落ちている英語のテスト：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-blue)',
      instruction: 'プリントに謎の書き込みがある。東校舎の美術室（Player B）にヒントがあるかもしれない。',
      showControl: true,
      code: '0',
      successMsg: '【ロック解除！】\nロッカーの扉が開いた！中に美術室の鍵コードのヒントがあった：\n「美術室のコードは、英語で美術を表す単語『ART』の文字数の2倍だ（3 × 2 = 6）」'
    },
    '3-3': {
      title: '西校舎 3年3組 ／ 黒板の落書き',
      icon: '🎨',
      clueLabel: '黒板に描かれたカラーパレット：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-blue)',
      instruction: '色の数式が書かれている。東校舎の準備室（Player B）にいる相方にヒントを聞いてみよう。',
      showControl: true,
      code: '0',
      successMsg: '【ロック解除！】\n机の引き出しからカードキーが見つかった：\n「準備室のパスコードは【33】だ」'
    },
    'stairs-3f': {
      title: '西校舎 3階階段 ／ 踊り場の電子錠',
      icon: '🪜',
      clueLabel: '3階階段の非常ロック：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-blue)',
      instruction: '2階へ降りる扉には電子ロックがかかっている。<br>どうやら音楽室（Player B）を解いた相方がヒントを持っているようだ。',
      showControl: true,
      code: '0',
      successMsg: '【3階ゲートロック解除！】\n西校舎の3階階段のゲートが開いた！2階へ降りられるようになったよ。'
    },
    '2-1': {
      title: '西校舎 2年1組 ／ 施錠された教室',
      icon: '📚',
      clueLabel: '南京錠で施錠された扉：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-purple)',
      instruction: '教室の扉は頑丈な南京錠で施錠されている。南京錠を解除するためのコードをキーパッドに入力しよう。',
      showControl: true,
      code: '0',
      successMsg: '【ロック解除！】\n扉がガチャリと開いた！黒板の隅に書かれている：\n「理科室のパスコードは【0】だ」'
    },
    '2-2': {
      title: '西校舎 2年2組 ／ 散らばったパズル',
      icon: '🧩',
      clueLabel: '机の上の木製パズル：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-purple)',
      instruction: 'パズルのピースが散らばっている。解読してみよう。',
      showControl: true,
      code: '0',
      successMsg: '【ロック解除！】\nパズルが完成し、引き出しから鍵コードの手がかりが見つかった！'
    },
    '2-3': {
      title: '西校舎 2年3組 ／ 動きを止めた時計',
      icon: '⏰',
      clueLabel: '壁の振り子時計：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-purple)',
      instruction: '振り子時計が妙な位置で止まっている。解読してみよう。',
      showControl: true,
      code: '0',
      successMsg: '【ロック解除！】\n時計の文字盤が開き、中から手がかりが見つかった！'
    },
    'stairs-2f': {
      title: '西校舎 2階階段 ／ 踊り場の電子錠',
      icon: '🪜',
      clueLabel: '2階階段の非常ロック：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-blue)',
      instruction: '1階へ降りる扉にロックがかかっている。理科室（Player B）を解いた相方がコード of ヒントを持っているはずだ。',
      showControl: true,
      code: '0',
      successMsg: '【2階ゲートロック解除！】\n西校舎の2階階段のゲートが開いた！1階へ降りられるようになったよ。'
    },
    '1-1': {
      title: '西校舎 1年1組 ／ 静まり返った教室',
      icon: '🏫',
      clueLabel: '教卓の引き出しのダイヤルロック：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-red)',
      instruction: '教卓に頑丈なダイヤルロックがかけられている。職員室（Player B）の相方にヒントがないか聞いてみよう。',
      showControl: true,
      code: '0',
      successMsg: '【教卓ロック解除！】\n引き出しが開いた！中から「昇降口の鍵A」を手に入れた！'
    },
    '1-2': {
      title: '西校舎 1年2組 ／ 破られたノート',
      icon: '📖',
      clueLabel: 'ノートの切れ端：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-red)',
      instruction: 'ノートの切れ端に何か書き残されている。解読してみよう。',
      showControl: true,
      code: '0',
      successMsg: '【ロック解除！】\n破られたページが復元され、手がかりが読み取れるようになった！'
    },
    '1-3': {
      title: '西校舎 1年3組 ／ 閉ざされた窓',
      icon: '🪟',
      clueLabel: '窓ガラスの汚れ：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-red)',
      instruction: '窓ガラスの汚れが文字のように見える。解読してみよう.。',
      showControl: true,
      code: '0',
      successMsg: '【ロック解除！】\n窓のロックが解除され、外に書かれた文字が見えるようになった！'
    },
    'entrance': {
      title: '西校舎 扉 ／ 脱出用デジタルゲート',
      icon: '🚪',
      clueLabel: '最終脱出ゲートキー：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-red)',
      instruction: '学校から脱出するための重いデジタル扉だ。<br>開けるには、西の「鍵A（1-1で入手）」と東の「鍵B（職員室で入手）」の組み合わせコードが必要です。',
      showControl: true,
      code: '0',
      successMsg: '【扉ロック解除！】\nマスターキーAを回し、西側のロックを外した！玄関前への道が開いたよ。'
    },
    'gate1': {
      title: '西校舎 玄関前 ／ 屋内結節エリア',
      icon: '🚪',
      clueLabel: '玄関前の鍵ボックス：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-purple)',
      instruction: '扉を抜けた先に広がる屋内結節エリアだ。<br>外に出るには別の鍵が必要のようだ…',
      showControl: true,
      code: '0',
      successMsg: '【玄関前ロック解除！】\n鍵ボックスが開いた！玄関ゲートの鍵を入手した。'
    },
    'gate2': {
      title: '西校舎 玄関 ／ 最終出口ゲート',
      icon: '🚪',
      clueLabel: '玄関チェーンロック：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-purple)',
      instruction: '屋外へとつながる大きな玄関チェーンロックだ。<br>最後の屋外ゲートを解除すれば、正門へ到達できる！',
      showControl: true,
      code: '0',
      successMsg: '【玄関ロック解除！】\n大きなチェーンが外れた！正門への道が開けたよ。'
    },
    'gate3': {
      title: '西校舎 正門 ／ 完全脱出口',
      icon: '🚩',
      clueLabel: '正門電子ロック：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-purple)',
      instruction: '最後の防壁だ！正門の電子ロックを解除すれば、いよいよ脱出成功だ！<br>お互いが正門コードを入力して、一緒にゲートを開こう！',
      showControl: true,
      code: '0',
      successMsg: '【正門解除！】\n西側の正門が開いた！脱出まであと一歩！'
    },
    'default': {
      title: '西校舎 教室 ／ 暗闇の部屋',
      icon: '🚪',
      clueLabel: '施錠中：',
      clueHtml: '',
      clueColor: 'var(--color-text-muted)',
      instruction: '鍵がかかっているようだ。今はまだ探索する意味がない。他の部屋を調べよう。',
      showControl: false
    }
  };

  const roomsEast = {
    'music': {
      title: '東校舎 音楽室 ／ 月光 of ピアノ',
      icon: '🎹',
      clueLabel: '閉ざされたグランドピアノ：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-purple)',
      instruction: '不気味なグランドピアノの鍵盤の蓋が閉まっている。<br>開けるには鍵コードが必要だ。3-1（Player A）の相方がヒントを見つけているかもしれない。',
      showControl: true,
      code: '0',
      successMsg: '【ピアノが開いた！】\n鍵盤の奥から楽譜が見つかった：「3階階段のコードは、お互いの暗号の和（Player Aの暗号【0】 + 音楽室の暗号【0】 = 0）だ」'
    },
    'art': {
      title: '東校舎 美術室 ／ 石膏像の台座',
      icon: '🗿',
      clueLabel: '台座に刻まれたコード入力装置：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-purple)',
      instruction: '石膏像の台座に鍵がかかっている。西校舎の3-2（Player A）の相方がヒントを見つけているはずだ。',
      showControl: true,
      code: '0',
      successMsg: '【石膏像が動いた！】\n台座がスライドして隠し引き出しが現れた！中からメモが見つかった：\n「3-2の鍵コードは、美術室でよく使う道具『CANVAS』の最後の文字だ」'
    },
    'prep': {
      title: '東校舎 準備室 ／ 標本棚の電子南京錠',
      icon: '🧪',
      clueLabel: '棚の電子ロック：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-purple)',
      instruction: '標本棚が電子ロックで閉じられている。西校舎の3-3（Player A）の相方がヒントを持っているかもしれない。',
      showControl: true,
      code: '0',
      successMsg: '【標本棚が開いた！】\n標本瓶の裏からメモが出てきた：\n「3-3の答えは、RED（3文字）とBLUE（4文字）とPURPLE（6文字）の合計（13）から5を引いた数だ」'
    },
    'stairs-3f': {
      title: '東校舎 3階階段 ／ 踊り場の電子錠',
      icon: '🪜',
      clueLabel: '3階階段の非常ロック：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-green)',
      instruction: '2階へ降りる扉には電子ロックがかかっている。<br>音楽室（Player B）のピアノを開けて見つけた暗号式を計算しよう。',
      showControl: true,
      code: '0',
      successMsg: '【3階ゲートロック解除！】\n東校舎の3階階段のゲートが開いた！2階へ降りられるようになったよ。'
    },
    'science': {
      title: '東校舎 理科室 ／ 役に立つ実験机',
      icon: '🧪',
      clueLabel: '机の上の実験装置パネル：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-green)',
      instruction: '実験装置がロックされている。解くための手がかりは、西校舎2-1（Player A）の相方が見つけているはずだ。',
      showControl: true,
      code: '0',
      successMsg: '【実験装置が起動した！】\nモニターに文字が浮かび上がった：「2階階段のコードは、お互いの暗号の差（Player A of 暗号【0】 - 理科室の暗号【0】 = 0）だ」'
    },
    'cooking': {
      title: '東校舎 家庭科室 ／ 静まり返った調理台',
      icon: '🍳',
      clueLabel: '調理台の上のレシピカード：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-green)',
      instruction: '調理台の上に不自然にレシピカードが置かれている。解読してみよう。',
      showControl: true,
      code: '0',
      successMsg: '【ロック解除！】\nレシピ本の底から手がかりが見つかった！'
    },
    'meeting': {
      title: '東校舎 会議室 ／ 円卓のメモ',
      icon: '📋',
      clueLabel: '円卓に残された会議メモ：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-green)',
      instruction: '円卓の上に置かれたバインダーに謎のメモがある。解読してみよう。',
      showControl: true,
      code: '0',
      successMsg: '【ロック解除！】\nバインダーの底から手がかりが見つかった！'
    },
    'stairs-2f': {
      title: '東校舎 2階階段 ／ 踊り場の電子錠',
      icon: '🪜',
      clueLabel: '2階階段 of 非常ロック：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-green)',
      instruction: '1階へ降りる扉にロックがかかっている。理科室（Player B）の装置を起動して見つけた暗号式を計算しよう。',
      showControl: true,
      code: '0',
      successMsg: '【2階ゲートロック解除！】\n東校舎の2階階段のゲートが開いた！1階へ降りられるようになったよ。'
    },
    'staff': {
      title: '東校舎 職員室 ／ 壁の大型金庫',
      icon: '📁',
      clueLabel: 'ダイヤル式金庫：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-green)',
      instruction: '壁にはめ込まれた金庫のロックだ。解除コードは、1-1（Player A）の相方が金庫の鍵コードの手がかりを持っているかもしれない。',
      showControl: true,
      code: '0',
      successMsg: '【金庫ロック解除！】\n金庫が開いた！中から「昇降口の鍵B」を手に入れた！\nさらにメモが入っている：「脱出コードは【0】だ」'
    },
    'principal': {
      title: '東校舎 校長室 ／ 歴代校長の肖像画',
      icon: '🖼️',
      clueLabel: '飾られた肖像画の額縁：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-green)',
      instruction: '初代校長の肖像画の目が少しずれている。解読してみよう。',
      showControl: true,
      code: '0',
      successMsg: '【ロック解除！】\n肖像画が傾き、金庫の手がかりとなるメモが見つかった！'
    },
    'infirmary': {
      title: '東校舎 保健室 ／ 視力検査の表',
      icon: '🩺',
      clueLabel: '壁の視力検査表：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-green)',
      instruction: '視力検査表のCの向きが奇妙に並んでいる。解読してみよう。',
      showControl: true,
      code: '0',
      successMsg: '【ロック解除！】\n視力検査表がスライドし、薬品棚のパスコードの手がかりが見つかった！'
    },
    'janitor': {
      title: '東校舎 扉 ／ 脱出のマスターキーB',
      icon: '🔑',
      clueLabel: '用務員室のキーボックス：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-green)',
      instruction: '用務員室の奥に、脱出ゲートを制御するマスターキーボックスがある。<br>解除コードは、西校舎の昇降口（Player A）の扉にヒントがあるかもしれない。',
      showControl: true,
      code: '0',
      successMsg: '【扉ロック解除！】\nキーボックスが開き、「マスターキーB」を手に入れた！\n玄関前への道が開いたよ。'
    },
    'gate1': {
      title: '東校舎 玄関前 ／ 屋内結節エリア',
      icon: '🚪',
      clueLabel: '玄関前の鍵ボックス：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-purple)',
      instruction: '扉を抜けた先に広がる屋内結節エリアだ。<br>外に出るには別の鍵が必要のようだ…',
      showControl: true,
      code: '0',
      successMsg: '【玄関前ロック解除！】\n鍵ボックスが開いた！玄関ゲートの鍵を入手した。'
    },
    'gate2': {
      title: '東校舎 玄関 ／ 最終出口ゲート',
      icon: '🚪',
      clueLabel: '玄関チェーンロック：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-purple)',
      instruction: '屋外へとつながる大きな玄関チェーンロックだ。<br>最後の屋外ゲートを解除すれば、正門へ到達できる！',
      showControl: true,
      code: '0',
      successMsg: '【玄関ロック解除！】\n大きなチェーンが外れた！正門への道が開けたよ。'
    },
    'gate3': {
      title: '東校舎 正門 ／ 完全脱出口',
      icon: '🚩',
      clueLabel: '正門電子ロック：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-purple)',
      instruction: '最後の防壁だ！正門の電子ロックを解除すれば、いよいよ脱出成功だ！<br>お互いが正門コードを入力して、一緒にゲートを開こう！',
      showControl: true,
      code: '0',
      successMsg: '【正門解除！】\n東側の正門が開いた！脱出まであと一歩！'
    },
    'default': {
      title: '東校舎 実習室 ／ 暗闇の部屋',
      icon: '🚪',
      clueLabel: '施錠中：',
      clueHtml: '',
      clueColor: 'var(--color-text-muted)',
      instruction: '鍵がかかっているようだ。今はまだ探索する意味がない。他の部屋を調べよう。',
      showControl: false
    }
  };

  // 部屋が属する階層（Floor）を取得
  function getRoomFloor(roomKey) {
    if (['3-1', '3-2', '3-3', 'stairs-3f', 'music', 'art', 'prep'].includes(roomKey)) return 3;
    if (['2-1', '2-2', '2-3', 'stairs-2f', 'science', 'cooking', 'meeting'].includes(roomKey)) return 2;
    if (['1-1', '1-2', '1-3', 'entrance', 'janitor', 'infirmary', 'principal', 'staff'].includes(roomKey)) return 1;
    // gate1/2/3は全て最下層（表示制御はhas-gate1/2/3クラスで行う）
    if (['gate1', 'gate2', 'gate3'].includes(roomKey)) return 0;
    return 0;
  }

  // --- マップの描画・更新ロジック ---
  function renderMapHelper(selector, roomNames, defaultLockMsg, unlockedFloor, playerKey) {
    document.querySelectorAll(`${selector} .map-cell`).forEach(cell => {
      const roomKey = cell.getAttribute('data-room');
      const floor = getRoomFloor(roomKey);
      
      if (floor >= unlockedFloor) {
        cell.classList.remove('locked-cell');
        cell.disabled = false;
        const name = roomNames[roomKey] || roomKey;
        cell.innerHTML = `<span>${name}</span>`;

        // 正解済みの部屋にcleared-cellクラスを付与
        if (clearedRooms[`${playerKey}-${roomKey}`]) {
          cell.classList.add('cleared-cell');
        } else {
          cell.classList.remove('cleared-cell');
        }
      } else {
        cell.classList.add('locked-cell');
        cell.classList.remove('cleared-cell');
        cell.disabled = true;
        cell.innerHTML = `<span>${defaultLockMsg}</span>`;
        cell.classList.remove('active-room');
      }
    });
  }

  function renderMap() {
    renderMapHelper('#map-west', roomNamesWest, '???', unlockedFloorA, 'a');
    renderMapHelper('#map-east', roomNamesEast, '???', unlockedFloorB, 'b');

    // 玄関段階に応じてhas-gate1/2/3クラスをトグル（西棟）
    const westGrid = document.querySelector('#map-west .map-grid');
    westGrid.classList.remove('has-gate1', 'has-gate2', 'has-gate3');
    if (clearedRooms['a-gate2']) westGrid.classList.add('has-gate3');
    else if (clearedRooms['a-gate1']) westGrid.classList.add('has-gate2');
    else if (unlockedFloorA === 0) westGrid.classList.add('has-gate1');

    // 玄関段階に応じてhas-gate1/2/3クラスをトグル（東棟）
    const eastGrid = document.querySelector('#map-east .map-grid');
    eastGrid.classList.remove('has-gate1', 'has-gate2', 'has-gate3');
    if (clearedRooms['b-gate2']) eastGrid.classList.add('has-gate3');
    else if (clearedRooms['b-gate1']) eastGrid.classList.add('has-gate2');
    else if (unlockedFloorB === 0) eastGrid.classList.add('has-gate1');
  }

  // --- UI更新処理 ---
  function updateRoomUI(player, data, roomKey) {
    const roleText = document.getElementById(`role-text-${player}`);
    const visual = document.getElementById(`visual-${player}`);
    const control = document.getElementById(`control-${player}`);
    const input = document.getElementById(`input-code-${player}`);
    const submitBtn = document.getElementById(`btn-submit-${player}`);

    roleText.textContent = data.title;
    visual.querySelector('.icon-placeholder').textContent = data.icon;
    visual.querySelector('.clue-label').textContent = data.clueLabel;
    
    const clueEl = visual.querySelector('.puzzle-clue');
    clueEl.innerHTML = data.clueHtml;
    clueEl.style.color = data.clueColor;
    clueEl.style.textShadow = `0 0 10px ${data.clueColor}`;
    
    visual.querySelector('.instruction-text').innerHTML = data.instruction;

    if (data.showControl) {
      control.style.display = 'flex';
      const isCleared = clearedRooms[`${player}-${roomKey}`];
      if (isCleared) {
        input.value = data.code;
        input.disabled = true;
        input.style.borderColor = data.clueColor;
        submitBtn.disabled = true;
        submitBtn.textContent = '解除済み';
        submitBtn.classList.add('btn-cleared');
        submitBtn.style.background = `${data.clueColor}33`;
      } else {
        input.value = '';
        input.disabled = false;
        input.style.borderColor = '';
        submitBtn.disabled = false;
        submitBtn.textContent = '回答';
        submitBtn.classList.remove('btn-cleared');
        submitBtn.style.background = '';
      }
    } else {
      control.style.display = 'none';
    }
  }

  // --- 階段・扉・玄関のロック解除判定 ---
  function checkStairsUnlock(player, roomKey) {
    if (player === 'a') {
      if (roomKey === 'stairs-3f') {
        unlockedFloorA = 2;
        showCustomAlert('【階層アンロック！】\nゴゴゴ…と不気味な重低音が響き、西校舎の2階への重い防火扉が開いた！\nマップから2階の部屋が探索できるようになったよ。');
      } else if (roomKey === 'stairs-2f') {
        unlockedFloorA = 1;
        showCustomAlert('【階層アンロック！】\nガチャリ…と大きな機械ロックが外れ、西校舎の1階へのゲートが開いた！\nマップから1階の部屋が探索できるようになったよ。扉へ向かおう！');
      } else if (roomKey === 'entrance') {
        unlockedFloorA = 0;
        showCustomAlert('【玄関前への道が開いた！】\nガコン！と大きなロック音が響き、1階の重い扉のロックが解除された！\nマップに「玄関前」が出現したよ。向かおう！');
        // 最終局面突入：BGMを緊迫モードに切り替え！
        bgm.switchToTensionMode();
      } else if (roomKey === 'gate1') {
        showCustomAlert('【玄関が解放された！】\n玄関前のロックが外れ、「玄関」が出現したよ！さらに奥へ進もう！');
      } else if (roomKey === 'gate2') {
        showCustomAlert('【正門が解放された！】\n玄関チェーンが外れ、最後の「正門」が出現したよ！脱出まであと一歩！');
      } else if (roomKey === 'gate3') {
        checkGameClear();
      }
    } else if (player === 'b') {
      if (roomKey === 'stairs-3f') {
        unlockedFloorB = 2;
        showCustomAlert('【階層アンロック！】\nゴゴゴ…と不気味な重低音が響き、東校舎の2階への重い防火扉が開いた！\nマップから2階の部屋が探索できるようになったよ。');
      } else if (roomKey === 'stairs-2f') {
        unlockedFloorB = 1;
        showCustomAlert('【階層アンロック！】\nガチャリ…と大きな機械ロックが外れ、東校舎の1階へのゲートが開いた！\nマップから1階の部屋が探索できるようになったよ。扉へ向かおう！');
      } else if (roomKey === 'janitor') {
        unlockedFloorB = 0;
        showCustomAlert('【玄関前への道が開いた！】\nガコン！と大きなロック音が響き、1階の重い扉のロックが解除された！\nマップに「玄関前」が出現したよ。向かおう！');
        // 最終局面突入：BGMを緊迫モードに切り替え！
        bgm.switchToTensionMode();
      } else if (roomKey === 'gate1') {
        showCustomAlert('【玄関が解放された！】\n玄関前のロックが外れ、「玄関」が出現したよ！さらに奥へ進もう！');
      } else if (roomKey === 'gate2') {
        showCustomAlert('【正門が解放された！】\n玄関チェーンが外れ、最後の「正門」が出現したよ！脱出まであと一歩！');
      } else if (roomKey === 'gate3') {
        checkGameClear();
      }
    }
    renderMap();
  }

  // --- 脱出判定（両者がgate3を解除でクリア） ---
  function checkGameClear() {
    if (clearedRooms['a-gate3'] && clearedRooms['b-gate3']) {
      const activeScreen = document.querySelector('.screen.active');
      const clearScreen = document.getElementById('clear-screen');
      switchScreen(activeScreen, clearScreen);
    } else {
      showCustomAlert('【正門解除中…】\n正門のロックは外れた！しかし、完全に脱出するにはもう一人のプレイヤーも「正門」のロックを解除する必要があるようだ…！');
    }
  }

  // --- 共通マップクリック登録処理 ---
  function registerMapCells(selector, playerKey, roomsMap, onSelect, getUnlockedFloor) {
    document.querySelectorAll(`${selector} .map-cell`).forEach(cell => {
      cell.addEventListener('click', () => {
        const roomKey = cell.getAttribute('data-room');
        const floor = getRoomFloor(roomKey);
        
        if (floor < getUnlockedFloor()) return;

        onSelect(roomKey);
        
        document.querySelectorAll(`${selector} .map-cell`).forEach(c => c.classList.remove('active-room'));
        cell.classList.add('active-room');
        
        const roomData = roomsMap[roomKey] || roomsMap['default'];
        updateRoomUI(playerKey, roomData, roomKey);
      });
    });
  }

  registerMapCells('#map-west', 'a', roomsWest, (key) => { currentRoomA = key; }, () => unlockedFloorA);
  registerMapCells('#map-east', 'b', roomsEast, (key) => { currentRoomB = key; }, () => unlockedFloorB);

  // --- イベントリスナー（画面遷移） ---
  btnStartGame.addEventListener('click', () => {
    switchScreen(titleScreen, selectionScreen);
  });

  routePlayerA.addEventListener('click', () => {
    switchScreen(selectionScreen, playerAScreen);
    unlockedFloorA = 3;
    currentRoomA = '3-1';
    renderMap();
    updateRoomUI('a', roomsWest['3-1'], '3-1');
  });

  routePlayerB.addEventListener('click', () => {
    switchScreen(selectionScreen, playerBScreen);
    unlockedFloorB = 3;
    currentRoomB = 'music';
    renderMap();
    updateRoomUI('b', roomsEast['music'], 'music');
  });

  // --- 共通送信処理 ---
  function handleCodeSubmit(playerKey, getCurrentRoomKey, roomsMap, inputEl) {
    const roomKey = getCurrentRoomKey();
    const roomData = roomsMap[roomKey] || roomsMap['default'];
    if (!roomData.showControl) return;

    const code = inputEl.value.trim();
    if (code === roomData.code) {
      bgm.playCorrect(); // ピンポン音
      showCustomAlert(roomData.successMsg);
      clearedRooms[`${playerKey}-${roomKey}`] = true;
      updateRoomUI(playerKey, roomData, roomKey);
      renderMap();
      
      // 階段・扉・玄関前・玄関・正門の判定
      if (roomKey.startsWith('stairs-') || roomKey === 'entrance' || roomKey === 'janitor'
          || roomKey === 'gate1' || roomKey === 'gate2' || roomKey === 'gate3') {
        checkStairsUnlock(playerKey, roomKey);
      }
    } else {
      bgm.playWrong(); // ブブー音
      showCustomAlert('【エラー】\nコードが違います。不気味な音が響き渡った。');
      inputEl.value = '';
      inputEl.style.borderColor = 'var(--color-neon-red)';
      setTimeout(() => {
        inputEl.style.borderColor = '';
      }, 1000);
    }
  }

  btnSubmitA.addEventListener('click', () => {
    handleCodeSubmit('a', () => currentRoomA, roomsWest, inputCodeA);
  });

  btnSubmitB.addEventListener('click', () => {
    handleCodeSubmit('b', () => currentRoomB, roomsEast, inputCodeB);
  });

  inputCodeA.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btnSubmitA.click();
  });
  inputCodeB.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btnSubmitB.click();
  });

  // --- Web Audio APIを使用した「夜の学校風」BGM自動生成・作曲クラス ---
  class NightSchoolBGM {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.isPlaying = false;
      this.isMuted = false;
      this.isTension = false; // 最終ステージの緊迫モードフラグ
      
      this.bpm = 75; // 通常BPM
      this.stepTime = 60 / this.bpm / 4;
      this.currentStep = 0;
      this.nextNoteTime = 0.0;
      this.timerId = null;
      this.oscillators = [];
      this.defaultVolume = 0.3; // 音量0.3
      
      // 通常時 (C - G - Am - F)
      this.normalChords = [
        { root: 65.41,  notes: [130.81, 164.81, 196.00, 261.63] }, // C (C2, C3, E3, G3, C4)
        { root: 98.00,  notes: [146.83, 196.00, 246.94, 293.66] }, // G (G2, D3, G3, B3, D4)
        { root: 55.00,  notes: [110.00, 130.81, 164.81, 220.00] }, // Am (A1, A2, C3, E3, A3)
        { root: 87.31,  notes: [130.81, 174.61, 220.00, 261.63] }  // F (F2, C3, F3, A3, C4)
      ];

      // 緊迫時マイナーコード (Am - F - Dm - E7)
      this.tensionChords = [
        { root: 55.00,  notes: [110.00, 130.81, 164.81, 220.00] }, // Am
        { root: 87.31,  notes: [130.81, 174.61, 220.00, 261.63] }, // F
        { root: 73.42,  notes: [110.00, 146.83, 174.61, 220.00] }, // Dm
        { root: 82.41,  notes: [116.54, 164.81, 207.65, 246.94] }  // E7 (G#を含む不穏な響き)
      ];

      this.chords = this.normalChords;
    }

    init() {
      if (this.ctx) return;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.defaultVolume, this.ctx.currentTime);
      
      // テンポ同期ディレイ
      const delay = this.ctx.createDelay(2.0);
      delay.delayTime.value = (60 / this.bpm) * 0.75;
      
      const feedback = this.ctx.createGain();
      feedback.gain.value = 0.38;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 450;
      
      delay.connect(filter);
      filter.connect(feedback);
      feedback.connect(delay);
      
      this.masterGain.connect(this.ctx.destination);
      delay.connect(this.masterGain);
      this.delayNode = delay;
    }

    start() {
      this.init();
      if (!this.ctx || this.isPlaying) return;
      
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.isPlaying = true;
      this.currentStep = 0;
      this.nextNoteTime = this.ctx.currentTime;
      
      const scheduler = () => {
        if (!this.isPlaying) return;
        
        // alert()などのダイアログ表示でスレッドが一時停止し、現在時刻が発音予定時刻を大幅に過ぎた場合、
        // 予定時刻を現在時刻にリセットして同期を回復し、BGMが停止したり破綻するのを防ぐセーフガード処理
        if (this.nextNoteTime < this.ctx.currentTime) {
          this.nextNoteTime = this.ctx.currentTime;
        }

        while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
          this.scheduleNextStep(this.currentStep, this.nextNoteTime);
          this.nextStep();
        }
        this.timerId = setTimeout(scheduler, 25);
      };
      
      scheduler();
    }

    nextStep() {
      this.currentStep = (this.currentStep + 1) % 64;
      this.nextNoteTime += this.stepTime;
    }

    // 最終局面の緊迫したBGMモードに切り替え
    switchToTensionMode() {
      if (this.isTension) return;
      this.isTension = true;
      
      // 焦りを感じつつも謎解きに集中できるBPM112に微調整
      this.bpm = 112;
      this.stepTime = 60 / this.bpm / 4;
      this.chords = this.tensionChords;

      // ディレイタイムも即座にテンポ同期
      if (this.ctx && this.delayNode) {
        const now = this.ctx.currentTime;
        this.delayNode.delayTime.setValueAtTime(this.delayNode.delayTime.value, now);
        this.delayNode.delayTime.linearRampToValueAtTime((60 / this.bpm) * 0.75, now + 0.5);
      }
    }

    switchToNormalMode() {
      if (!this.isTension) return;
      this.isTension = false;
      this.bpm = 75;
      this.stepTime = 60 / this.bpm / 4;
      this.chords = this.normalChords;

      if (this.ctx && this.delayNode) {
        const now = this.ctx.currentTime;
        this.delayNode.delayTime.setValueAtTime(this.delayNode.delayTime.value, now);
        this.delayNode.delayTime.linearRampToValueAtTime((60 / this.bpm) * 0.75, now + 0.5);
      }
    }

    scheduleNextStep(step, time) {
      if (this.isMuted) return;

      const chordIndex = Math.floor(step / 16);
      const chord = this.chords[chordIndex];
      const stepInBar = step % 16;

      if (this.isTension) {
        // === 最終問題の緊迫BGM演奏モード（BPM 112 / 鋭い音源） ===
        
        // 1. 唸るシンセベース音（のこぎり波＋レゾナンスローパスフィルターでアシッドな低音）
        // 8分音符で「ズンズンズンズン…」と疾走させる
        if (stepInBar % 2 === 0) {
          const vol = (stepInBar % 4 === 0) ? 0.08 : 0.06;
          this.playTensionBass(chord.root, vol, time);
        }

        // 2. タイトな4つ打ちキック ＆ 金属ハット
        // 4つ打ちキック
        if (stepInBar % 4 === 0) {
          this.playKick(time, 0.11);
        }
        // 金属ハイハット
        if (stepInBar % 2 === 0) {
          const hatVol = (stepInBar % 4 === 2) ? 0.045 : 0.025;
          this.playHats(time, hatVol);
        }
        if (stepInBar === 15) {
          this.playHats(time, 0.02);
          this.playHats(time + this.stepTime / 2, 0.015);
        }

        // 3. 緊迫メロディ（三角波による少し鋭く冷たいピコピコベル）
        if (stepInBar === 0) {
          this.playTensionMelody(chord.notes[0], 0.065, time, 0.22); // 8分
        } else if (stepInBar === 2) {
          this.playTensionMelody(chord.notes[1], 0.065, time, 0.22); // 8分
        } else if (stepInBar === 4) {
          this.playTensionMelody(chord.notes[2], 0.065, time, 0.45); // 4分
        } else if (stepInBar === 8) {
          this.playTensionMelody(chord.notes[3], 0.07, time, 0.45);  // 4分
        } else if (stepInBar === 12) {
          // 最後の拍は「8分 + 16分 + 16分」で不穏に駆け上がる
          this.playTensionMelody(chord.notes[2], 0.06, time, 0.22);
          this.playTensionMelody(chord.notes[1], 0.05, time + this.stepTime * 2, 0.11);
          this.playTensionMelody(chord.notes[3], 0.045, time + this.stepTime * 3, 0.11);
        }

        // アレンジ：偶数小節のステップ10で、不協和な半音ゴースト音をピピッっと入れる
        if (chordIndex % 2 === 1 && stepInBar === 10) {
          this.playTensionMelody(chord.notes[3] * 1.06, 0.035, time, 0.15);
        }

      } else {
        // === 通常の謎解きBGM演奏モード ===
        
        // 1. 通常ベース（8分音符で適度に動くウォーキングベース）
        if (stepInBar === 0) {
          this.playSine(chord.root, 0.08, time, 0.04, 0.8);
        } else if (stepInBar === 6) {
          this.playSine(chord.notes[1], 0.05, time, 0.04, 0.4);
        } else if (stepInBar === 8) {
          this.playSine(chord.root, 0.07, time, 0.04, 0.6);
        } else if (stepInBar === 14) {
          const connectFreq = chord.notes[2];
          this.playSine(connectFreq, 0.06, time, 0.04, 0.3);
        }

        // 2. 通常ドラム（Lo-Fi風の跳ねるキック ＆ ウッドブロック）
        if (stepInBar === 0 || stepInBar === 8) {
          this.playKick(time, 0.09);
        } else if (stepInBar === 6 || stepInBar === 14) {
          this.playKick(time, 0.045);
        }

        if (stepInBar === 4 || stepInBar === 12) {
          this.playWoodBlock(time, 240, 0.06);
        } else if (stepInBar === 15) {
          this.playWoodBlock(time, 280, 0.025);
          this.playWoodBlock(time + this.stepTime / 2, 260, 0.02);
        }

        // 3. 通常メロディ (8, 8, 4, 4, 4 リズム ＆ 装飾アレンジ)
        const isLastBar = (chordIndex === 3);

        if (stepInBar === 0) {
          this.playMelody(chord.notes[0], 0.05, time, 0.4);
        } else if (stepInBar === 2) {
          this.playMelody(chord.notes[1], 0.05, time, 0.4);
        } else if (stepInBar === 4) {
          this.playMelody(chord.notes[2], 0.05, time, 0.8);
        } else if (stepInBar === 8) {
          this.playMelody(chord.notes[3], 0.05, time, 0.8);
        } else if (stepInBar === 12) {
          if (isLastBar) {
            this.playMelody(chord.notes[1], 0.05, time, 0.4);
            this.playMelody(chord.notes[2], 0.04, time + this.stepTime * 2, 0.2);
            this.playMelody(chord.notes[3], 0.035, time + this.stepTime * 3, 0.2);
          } else {
            this.playMelody(chord.notes[1], 0.05, time, 0.8);
          }
        }

        if (chordIndex === 1 && stepInBar === 10) {
          this.playMelody(chord.notes[3] * 1.5, 0.02, time, 0.25);
        }
        
        if (chordIndex === 2 && stepInBar === 6) {
          this.playMelody(chord.notes[2], 0.035, time, 0.3);
        }
      }
    }

    playSine(freq, volume, time, attack, release) {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(volume, time + attack);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + attack + release);
      
      osc.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      osc.start(time);
      osc.stop(time + attack + release + 0.1);
    }

    // 緊迫ベース：のこぎり波 + 遮断周波数280Hzのレゾナンスローパスフィルター
    playTensionBass(freq, volume, time) {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      
      filter.type = 'lowpass';
      filter.frequency.value = 280;
      filter.Q.value = 5.0;
      
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(volume * 1.6, time + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);
      
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      osc.start(time);
      osc.stop(time + 0.17);
    }

    playMelody(freq, volume, time, duration = 1.2) {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(volume, time + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      
      osc.connect(gainNode);
      gainNode.connect(this.masterGain);
      gainNode.connect(this.delayNode);
      
      osc.start(time);
      osc.stop(time + duration + 0.2);
    }

    // 緊迫メロディ：三角波 + ローパスフィルターによるデジタルシンセ音色
    playTensionMelody(freq, volume, time, duration = 0.4) {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      filter.type = 'lowpass';
      filter.frequency.value = 750;
      
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(volume, time + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      gainNode.connect(this.delayNode);
      
      osc.start(time);
      osc.stop(time + duration + 0.1);
    }

    playKick(time, volume) {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(100, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.2);
      
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(volume, time + 0.008);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
      
      osc.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      osc.start(time);
      osc.stop(time + 0.22);
    }

    // 緊迫ハイハット：鋭い高周波ののこぎり波 + バンドパスフィルター
    playHats(time, volume = 0.05) {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.value = 9500;
      
      filter.type = 'bandpass';
      filter.frequency.value = 8500;
      
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(volume, time + 0.002);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.025);
      
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      osc.start(time);
      osc.stop(time + 0.035);
    }

    playWoodBlock(time, freq = 240, volume = 0.06) {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(volume, time + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
      
      osc.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      const delayGain = this.ctx.createGain();
      delayGain.gain.value = 0.15;
      gainNode.connect(delayGain);
      delayGain.connect(this.delayNode);

      osc.start(time);
      osc.stop(time + 0.14);
    }

    // 正解効果音：ピンポン（高→さらに高い2音のサイン波）
    playCorrect() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const se = this.ctx.createGain();
      se.gain.setValueAtTime(0.45, now);
      se.connect(this.ctx.destination);

      // 1音目「ピン」(880Hz)
      const o1 = this.ctx.createOscillator();
      const g1 = this.ctx.createGain();
      o1.type = 'sine';
      o1.frequency.value = 880;
      g1.gain.setValueAtTime(0, now);
      g1.gain.linearRampToValueAtTime(0.5, now + 0.01);
      g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      o1.connect(g1); g1.connect(se);
      o1.start(now); o1.stop(now + 0.2);

      // 2音目「ポン」(1320Hz)：少し遅らせる
      const o2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      o2.type = 'sine';
      o2.frequency.value = 1320;
      g2.gain.setValueAtTime(0, now + 0.14);
      g2.gain.linearRampToValueAtTime(0.5, now + 0.16);
      g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      o2.connect(g2); g2.connect(se);
      o2.start(now + 0.14); o2.stop(now + 0.45);
    }

    // 不正解効果音：ブブー（低い矩形波を二回短く鳴らす）
    playWrong() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const se = this.ctx.createGain();
      se.gain.setValueAtTime(0.35, now);
      se.connect(this.ctx.destination);

      [0, 0.22].forEach(offset => {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        o.type = 'sawtooth';
        o.frequency.value = 110; // 低くてブブな周波数
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        g.gain.setValueAtTime(0, now + offset);
        g.gain.linearRampToValueAtTime(0.6, now + offset + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
        o.connect(filter); filter.connect(g); g.connect(se);
        o.start(now + offset); o.stop(now + offset + 0.2);
      });
    }

    stop() {
      this.isPlaying = false;
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      if (this.masterGain) {
        const targetVol = this.isMuted ? 0 : this.defaultVolume;
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 0.3);
      }
      return this.isMuted;
    }
  }

  const bgm = new NightSchoolBGM();

  // タイトル画面のスタートボタンでBGM開始
  btnStartGame.addEventListener('click', () => {
    bgm.start();
  });

  // 直接ゲーム画面（西棟・東棟）に入った場合でもBGMを開始する
  // 同時に、すでに玄関前がアンロックされている進行度なら最初から緊迫BGMに設定する
  routePlayerA.addEventListener('click', () => {
    bgm.start();
    if (unlockedFloorA === 0) {
      bgm.switchToTensionMode();
    } else {
      bgm.switchToNormalMode();
    }
  });
  routePlayerB.addEventListener('click', () => {
    bgm.start();
    if (unlockedFloorB === 0) {
      bgm.switchToTensionMode();
    } else {
      bgm.switchToNormalMode();
    }
  });

  // ミュート切り替えイベント登録
  const btnMuteA = document.getElementById('btn-mute-a');
  const btnMuteB = document.getElementById('btn-mute-b');

  function updateMuteButtons(muted) {
    const text = muted ? '🔇 BGM OFF' : '🔊 BGM ON';
    if (btnMuteA) btnMuteA.textContent = text;
    if (btnMuteB) btnMuteB.textContent = text;
  }

  if (btnMuteA) {
    btnMuteA.addEventListener('click', () => {
      if (!bgm.isPlaying) {
        bgm.start();
        if (unlockedFloorA === 0) bgm.switchToTensionMode();
        updateMuteButtons(false);
      } else {
        const muted = bgm.toggleMute();
        updateMuteButtons(muted);
      }
    });
  }

  if (btnMuteB) {
    btnMuteB.addEventListener('click', () => {
      if (!bgm.isPlaying) {
        bgm.start();
        if (unlockedFloorB === 0) bgm.switchToTensionMode();
        updateMuteButtons(false);
      } else {
        const muted = bgm.toggleMute();
        updateMuteButtons(muted);
      }
    });
  }
});
