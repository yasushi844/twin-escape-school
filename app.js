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
  let unlockedFloorA = 4; // 西校舎の進行状態（4=RF, 3=3F, ...）
  let unlockedFloorB = 4; // 東校舎の進行状態
  let currentRoomA = 'rooftop';
  let currentRoomB = 'rooftop';

  // 各部屋の解除状態を記録
  const clearedRooms = {
    'a-rooftop': false, 'a-stairs-rf': false,
    'a-3-1': false, 'a-3-2': false, 'a-3-3': false, 'a-stairs-3f': false,
    'a-2-1': false, 'a-2-2': false, 'a-2-3': false, 'a-stairs-2f': false,
    'a-1-1': false, 'a-1-2': false, 'a-1-3': false, 'a-entrance': false,
    'a-gate1': false, 'a-gate2': false, 'a-gate3': false,

    'b-rooftop': false, 'b-stairs-rf': false,
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
    'rooftop': '屋上', 'stairs-rf': '階段',
    '3-1': '3-1', '3-2': '3-2', '3-3': '3-3', 'stairs-3f': '階段',
    '2-1': '2-1', '2-2': '2-2', '2-3': '2-3', 'stairs-2f': '階段',
    '1-1': '1-1', '1-2': '1-2', '1-3': '1-3', 'entrance': '扉',
    'gate1': '玄関前', 'gate2': '玄関', 'gate3': '正門'
  };

  const roomNamesEast = {
    'rooftop': '屋上', 'stairs-rf': '階段',
    'music': '音楽室', 'art': '美術室', 'prep': '準備室', 'stairs-3f': '階段',
    'science': '理科室', 'cooking': '家庭科', 'meeting': '会議室', 'stairs-2f': '階段',
    'staff': '職員室', 'principal': '校長室', 'infirmary': '保健室', 'janitor': '扉',
    'gate1': '玄関前', 'gate2': '玄関', 'gate3': '正門'
  };

  // --- 自動移動用の次の部屋定義 ---
  const nextRoomsA = {
    'rooftop': 'stairs-rf', 'stairs-rf': '3-1',
    '3-1': '3-2', '3-2': '3-3', '3-3': 'stairs-3f', 'stairs-3f': '2-1',
    '2-1': '2-2', '2-2': '2-3', '2-3': 'stairs-2f', 'stairs-2f': '1-1',
    '1-1': '1-2', '1-2': '1-3', '1-3': 'entrance', 'entrance': 'gate1',
    'gate1': 'gate2', 'gate2': 'gate3'
  };

  const nextRoomsB = {
    'rooftop': 'stairs-rf', 'stairs-rf': 'music',
    'music': 'art', 'art': 'prep', 'prep': 'stairs-3f', 'stairs-3f': 'science',
    'science': 'cooking', 'cooking': 'meeting', 'meeting': 'stairs-2f', 'stairs-2f': 'staff',
    'staff': 'principal', 'principal': 'infirmary', 'infirmary': 'janitor', 'janitor': 'gate1',
    'gate1': 'gate2', 'gate2': 'gate3'
  };

  // --- 共通の終盤エリアデータ生成ファクトリ ---
  const createCommonGates = (prefix) => ({
    'gate1': {
      title: `${prefix} 玄関前 ／ 屋内結節エリア`,
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
      title: `${prefix} 玄関 ／ 最終出口ゲート`,
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
      title: `${prefix} 正門 ／ 完全脱出口`,
      icon: '🚩',
      clueLabel: '正門電子ロック：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-red)',
      instruction: '最後の防壁だ！正門の電子ロックを解除すれば、いよいよ脱出成功だ！<br>お互いが正門コードを入力して、一緒にゲートを開こう！',
      showControl: true,
      code: '0',
      successMsg: `【正門解除！】\n${prefix}の正門が開いた！脱出まであと一歩！`
    },
    'default': {
      title: `${prefix} 教室 ／ 暗闇の部屋`,
      icon: '🚪',
      clueLabel: '施錠中：',
      clueHtml: '',
      clueColor: 'var(--color-text-muted)',
      instruction: '鍵がかかっているようだ。今はまだ探索する意味がない。他の部屋を調べよう。',
      showControl: false
    }
  });

  // --- 部屋データ定義 ---
  const roomsWest = {
    'rooftop': {
      title: '西校舎 屋上 ／ チュートリアル',
      icon: '🏫',
      clueLabel: '最初の謎：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-blue)',
      instruction: 'ここは西校舎の屋上だ。まずは肩慣らしに簡単な謎を解こう。<br>画面下の入力欄に「START」と入力してね。',
      showControl: true,
      code: 'START',
      successMsg: '【ロック解除！】\n階段へ進む扉が開いた！次の部屋へ進もう！'
    },
    'stairs-rf': {
      title: '西校舎 屋上階段 ／ 3階への扉',
      icon: '🪜',
      clueLabel: '階段のロック：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-blue)',
      instruction: '3階へ降りる扉にロックがかかっている。<br>ここには「0」と入力してみてね。',
      showControl: true,
      code: '0',
      successMsg: '【屋上ゲートロック解除！】\n階段のゲートが開いた！3階へ降りられるようになったよ。'
    },
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
      clueColor: 'var(--color-neon-blue)',
      instruction: '学校から脱出するための重いデジタル扉だ。<br>開けるには、西の「鍵A（1-1で入手）」と東の「鍵B（職員室で入手）」の組み合わせコードが必要です。',
      showControl: true,
      code: '0',
      successMsg: '【扉ロック解除！】\nマスターキーAを回し、西側のロックを外した！玄関前への道が開いたよ。'
    },
    ...createCommonGates('西校舎')
  };

  const roomsEast = {
    'rooftop': {
      title: '東校舎 屋上 ／ チュートリアル',
      icon: '🏫',
      clueLabel: '最初の謎：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-purple)',
      instruction: 'ここは東校舎の屋上だ。相方と協力して脱出を目指そう。<br>画面下の入力欄に「START」と入力してね。',
      showControl: true,
      code: 'START',
      successMsg: '【ロック解除！】\n階段へ進む扉が開いた！次の部屋へ進もう！'
    },
    'stairs-rf': {
      title: '東校舎 屋上階段 ／ 3階への扉',
      icon: '🪜',
      clueLabel: '階段のロック：',
      clueHtml: '<img src="assets/template_clue.png" alt="謎問題">',
      clueColor: 'var(--color-neon-purple)',
      instruction: '3階へ降りる扉にロックがかかっている。<br>ここには「0」と入力してみてね。',
      showControl: true,
      code: '0',
      successMsg: '【屋上ゲートロック解除！】\n階段のゲートが開いた！3階へ降りられるようになったよ。'
    },
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
    ...createCommonGates('東校舎')
  };

  // 部屋が属する階層（Floor）を取得
  function getRoomFloor(roomKey) {
    if (['rooftop', 'stairs-rf'].includes(roomKey)) return 4;
    if (['3-1', '3-2', '3-3', 'stairs-3f', 'music', 'art', 'prep'].includes(roomKey)) return 3;
    if (['2-1', '2-2', '2-3', 'stairs-2f', 'science', 'cooking', 'meeting'].includes(roomKey)) return 2;
    if (['1-1', '1-2', '1-3', 'entrance', 'janitor', 'infirmary', 'principal', 'staff'].includes(roomKey)) return 1;
    // gate1/2/3は全て最下層（表示制御はhas-gate1/2/3クラスで行う）
    if (['gate1', 'gate2', 'gate3'].includes(roomKey)) return 0;
    return 0;
  }

  // --- マップの描画・更新ロジック ---
  function renderMapHelper(selector, roomNames, defaultLockMsg, unlockedFloor, playerKey) {
    const currentRoom = playerKey === 'a' ? currentRoomA : currentRoomB;

    document.querySelectorAll(`${selector} .map-cell`).forEach(cell => {
      const roomKey = cell.getAttribute('data-room');
      const floor = getRoomFloor(roomKey);
      
      // 現在地のハイライト（.active-room）を更新
      if (roomKey === currentRoom) {
        cell.classList.add('active-room');
      } else {
        cell.classList.remove('active-room');
      }

      if (floor >= unlockedFloor) {
        cell.classList.remove('locked-cell');
        cell.classList.remove('hidden-floor');
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
        // active-roomの削除は上で行っているため不要

        // ゲート（floor=0）以外の未解放フロア（1F, 2F, 3F）は階段を突破するまで完全に非表示にする
        if (floor > 0) {
          cell.classList.add('hidden-floor');
        } else {
          cell.classList.remove('hidden-floor');
        }
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
    const panelBody = visual.closest('.panel-body');

    // モーションアニメーション（フェードアウト）
    if (panelBody) {
      panelBody.classList.add('room-fade-out');
    }

    // フェードアウトの完了を待ってからDOMを書き換える
    setTimeout(() => {
      const titleParts = data.title.split(' ／ ');
      const locationName = titleParts[0];
      const puzzleTitleName = titleParts[1] || '';

      roleText.textContent = locationName;

      // 背景画像の動的切り替え
      const screenEl = document.getElementById(`player-${player}-screen`);
      let nextBg = '';
      if (['gate1', 'gate2', 'gate3'].includes(roomKey)) {
        nextBg = "url('assets/bg_main_gate.png')";
      } else if (roomKey.startsWith('stairs-')) {
        nextBg = "url('assets/bg_stairs.png')";
      } else if (roomKey === 'entrance' || roomKey === 'janitor') {
        nextBg = "url('assets/bg_firedoor.png')";
      } else if (roomKey === 'rooftop') {
        nextBg = "url('assets/bg_rooftop.png')";
      } else {
        nextBg = player === 'a' ? "url('assets/bg_classroom.png')" : "url('assets/bg_science.png')";
      }

      // 現在の背景と異なる場合、モーションアニメーションを行う
      // 押した瞬間に画像を切り替え、CSSアニメーションで演出する
      if (screenEl.style.backgroundImage !== '' && screenEl.style.backgroundImage !== nextBg.replace(/'/g, '"')) {
        screenEl.style.backgroundImage = nextBg;
        
        // アニメーションを最初から再生させるために一度クラスを外し、リフローを強制してから再付与
        screenEl.classList.remove('bg-instant-transition');
        void screenEl.offsetWidth; 
        screenEl.classList.add('bg-instant-transition');
      } else {
        screenEl.style.backgroundImage = nextBg;
      }

      const puzzleTitleEl = document.getElementById(`puzzle-title-${player}`);
      if (puzzleTitleEl) {
        puzzleTitleEl.textContent = puzzleTitleName;
        // 謎タイトルが存在しない場合は要素を非表示にして余計な空間を作らないようにする
        if (puzzleTitleName) {
          puzzleTitleEl.style.display = 'block';
        } else {
          puzzleTitleEl.style.display = 'none';
        }
      }

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
          submitBtn.textContent = '解答';
          submitBtn.classList.remove('btn-cleared');
          submitBtn.style.background = '';
        }
      } else {
        control.style.display = 'none';
      }

      // DOM書き換え後、フェードイン
      if (panelBody) {
        panelBody.classList.remove('room-fade-out');
      }
    }, 250); // 250ms待つ
  }

  // --- 階段・扉・玄関のロック解除判定 ---
  function checkStairsUnlock(player, roomKey, callback = null) {
    if (roomKey === 'stairs-rf') {
      if (player === 'a') unlockedFloorA = 3; else unlockedFloorB = 3;
    } else if (roomKey === 'stairs-3f') {
      if (player === 'a') unlockedFloorA = 2; else unlockedFloorB = 2;
    } else if (roomKey === 'stairs-2f') {
      if (player === 'a') unlockedFloorA = 1; else unlockedFloorB = 1;
    } else if (roomKey === 'entrance' || roomKey === 'janitor') {
      if (player === 'a') unlockedFloorA = 0; else unlockedFloorB = 0;
      bgm.switchToTensionMode(); // 最終局面突入
    } else if (roomKey === 'gate3') {
      checkGameClear(callback);
      return; // checkGameClear内で遷移処理をするためここで終了
    }
    
    if (callback) callback();
    renderMap();
  }

  // --- 脱出判定（両者がgate3を解除でクリア） ---
  function checkGameClear(callback = null) {
    if (clearedRooms['a-gate3'] && clearedRooms['b-gate3']) {
      const activeScreen = document.querySelector('.screen.active');
      const clearScreen = document.getElementById('clear-screen');
      switchScreen(activeScreen, clearScreen);
      if (callback) callback();
    } else {
      showCustomAlert('【正門解除中…】\n正門のロックは外れた！しかし、完全に脱出するにはもう一人のプレイヤーも「正門」のロックを解除する必要があるようだ…！', callback);
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

  // --- リッチな解錠（UNLOCK）エフェクト表示 ---
  function showUnlockEffect(themeClass, callback) {
    const overlay = document.createElement('div');
    overlay.className = `unlock-effect-overlay ${themeClass}`;
    
    // 錠前アイコン
    const iconContainer = document.createElement('div');
    iconContainer.className = 'unlock-icon-container';
    
    const iconShackle = document.createElement('div');
    iconShackle.className = 'unlock-icon-shackle';
    
    const iconBody = document.createElement('div');
    iconBody.className = 'unlock-icon-body';
    
    iconContainer.appendChild(iconShackle);
    iconContainer.appendChild(iconBody);
    
    // UNLOCKテキスト
    const text = document.createElement('div');
    text.className = 'unlock-text';
    text.textContent = 'UNLOCK';
    
    overlay.appendChild(iconContainer);
    overlay.appendChild(text);
    document.body.appendChild(overlay);
    
    // SE: ガチャリという重い金属音を追加で鳴らす（低いサイン波で代用）
    if (bgm && bgm.ctx) {
      bgm.playStaccato(150, 0.1, bgm.ctx.currentTime);
      bgm.playStaccato(120, 0.1, bgm.ctx.currentTime + 0.1);
      
      // 鍵が開くタイミング（0.5秒後）にもう一度音を鳴らす
      setTimeout(() => {
        bgm.playStaccato(220, 0.15, bgm.ctx.currentTime);
      }, 500);
    }
    
    // 1.5秒間エフェクトを表示した後にフェードアウト
    setTimeout(() => {
      overlay.classList.add('fade-out');
      // フェードアウト完了後にDOM削除と次への遷移
      setTimeout(() => {
        overlay.remove();
        if (callback) callback();
      }, 250);
    }, 1500); // 揺れる0.5秒 ＋ 文字が出てから1秒 ＝ 計1.5秒
  }


  // --- リッチな正解エフェクト表示 ---
  function showCorrectEffect(themeClass, callback) {
    const overlay = document.createElement('div');
    overlay.className = `correct-effect-overlay ${themeClass}`;
    
    const content = document.createElement('div');
    content.className = 'correct-effect-content';
    
    const text = document.createElement('div');
    text.className = 'correct-effect-text';
    text.textContent = 'CORRECT';
    
    const ring = document.createElement('div');
    ring.className = 'correct-effect-ring';
    
    content.appendChild(ring);
    content.appendChild(text);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    // 0.75秒間エフェクトを表示した後にフェードアウト
    setTimeout(() => {
      overlay.classList.add('fade-out');
      // フェードアウト完了後にDOM削除と次への遷移
      setTimeout(() => {
        overlay.remove();
        if (callback) callback();
      }, 250);
    }, 750);
  }

  // --- 共通送信処理 ---
  function handleCodeSubmit(playerKey, getCurrentRoomKey, roomsMap, inputEl) {
    const roomKey = getCurrentRoomKey();
    const roomData = roomsMap[roomKey] || roomsMap['default'];
    if (!roomData.showControl) return;

    const code = inputEl.value.trim();
    if (code === roomData.code) {
      bgm.playCorrect(); // ピンポン音
      clearedRooms[`${playerKey}-${roomKey}`] = true;
      updateRoomUI(playerKey, roomData, roomKey);
      renderMap();
      
      // 自動移動のためのコールバック
      const nextRoomMap = playerKey === 'a' ? nextRoomsA : nextRoomsB;
      const nextRoomKey = nextRoomMap[roomKey];
      
      const moveToNextRoom = () => {
        if (nextRoomKey) {
          if (playerKey === 'a') {
            currentRoomA = nextRoomKey;
            updateRoomUI('a', roomsWest[nextRoomKey], nextRoomKey);
          } else {
            currentRoomB = nextRoomKey;
            updateRoomUI('b', roomsEast[nextRoomKey], nextRoomKey);
          }
          renderMap();
        }
      };
      
      // 階段・扉・玄関前・玄関・正門の特殊イベント判定
      if (roomKey.startsWith('stairs-') || roomKey === 'entrance' || roomKey === 'janitor'
          || roomKey === 'gate1' || roomKey === 'gate2' || roomKey === 'gate3') {
        
        // 特殊イベント時はUNLOCKエフェクトを表示する
        const themeClass = roomKey.startsWith('gate') ? 'theme-gate' : (playerKey === 'a' ? 'theme-a' : 'theme-b');
        showUnlockEffect(themeClass, () => {
          checkStairsUnlock(playerKey, roomKey, moveToNextRoom);
        });
      } else {
        // 通常の謎解き正解時は解説アラートを廃止し、リッチエフェクトから自動遷移
        const themeClass = playerKey === 'a' ? 'theme-a' : 'theme-b';
        showCorrectEffect(themeClass, moveToNextRoom);
      }
    } else {
      bgm.playWrong(); // ブブー音
      inputEl.classList.add('input-error');
      
      // アニメーション完了後にクラスを外す
      setTimeout(() => {
        inputEl.classList.remove('input-error');
      }, 500);
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
      this.bpm = 80; // 3連符ワルツ用の少し速めのBPM
      this.stepTime = 60 / this.bpm / 3; // 1拍を3等分（8分3連符）
      this.currentStep = 0;
      this.nextNoteTime = 0.0;
      this.timerId = null;
      this.oscillators = [];
      this.defaultVolume = 1.06; // 音量を従来の0.53から2倍に変更
      
      // 通常時 (C - G - Am - F) 中音域へシフト
      this.normalChords = [
        { root: 261.63, notes: [261.63, 329.63, 392.00, 523.25] }, // C4
        { root: 196.00, notes: [293.66, 392.00, 493.88, 587.33] }, // G3
        { root: 220.00, notes: [220.00, 261.63, 329.63, 440.00] }, // A3
        { root: 174.61, notes: [261.63, 349.23, 440.00, 523.25] }  // F3
      ];

      // 緊迫時マイナーコード (Am - F - Dm - E7) 中音域へシフト
      this.tensionChords = [
        { root: 220.00, notes: [220.00, 261.63, 329.63, 440.00] }, // Am
        { root: 174.61, notes: [261.63, 349.23, 440.00, 523.25] }, // F
        { root: 293.66, notes: [293.66, 349.23, 440.00, 587.33] }, // Dm
        { root: 329.63, notes: [329.63, 415.30, 493.88, 659.25] }  // E7
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
      this.currentStep = (this.currentStep + 1) % 48; // 1小節12ステップ × 4小節 = 48ステップ
      this.nextNoteTime += this.stepTime;
    }

    // 最終局面の緊迫したBGMモードに切り替え
    switchToTensionMode() {
      if (this.isTension) return;
      this.isTension = true;
      
      // 焦りを感じつつも謎解きに集中できるテンポに微調整
      this.bpm = 110; // 緊迫モードの3連符テンポ
      this.stepTime = 60 / this.bpm / 3;
      this.chords = this.tensionChords;

      if (this.ctx && this.masterGain && !this.isMuted) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(this.defaultVolume * 0.66, now + 1.0); // 音量を2/3に下げる
      }

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
      this.bpm = 80;
      this.stepTime = 60 / this.bpm / 3;
      this.chords = this.normalChords;

      if (this.ctx && this.masterGain && !this.isMuted) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(this.defaultVolume, now + 1.0); // 音量を元に戻す
      }

      if (this.ctx && this.delayNode) {
        const now = this.ctx.currentTime;
        this.delayNode.delayTime.setValueAtTime(this.delayNode.delayTime.value, now);
        this.delayNode.delayTime.linearRampToValueAtTime((60 / this.bpm) * 0.75, now + 0.5);
      }
    }

    scheduleNextStep(step, time) {
      if (this.isMuted) return;

      const chordIndex = Math.floor(step / 12); // 12ステップで1小節
      const chord = this.chords[chordIndex % this.chords.length];
      const stepInBar = step % 12;

      if (this.isTension) {
        // === 最終問題の緊迫モード（3連符ワルツ） ===
        // 緊迫時はルート音を毎拍の頭に鳴らし、少し焦らせる
        if (stepInBar % 3 === 0) {
          this.playStaccato(chord.root, 0.06, time);
        }
        
        // 拍の裏で不規則にアルペジオを鳴らす
        if (stepInBar === 1 || stepInBar === 4 || stepInBar === 8 || stepInBar === 10) {
          const noteIndex = stepInBar % 4;
          this.playStaccato(chord.notes[noteIndex], 0.04, time);
        }
      } else {
        // === 通常の謎解きモード（不思議な3連符ワルツ） ===
        // ルート音は1拍目と3拍目の頭だけ
        if (stepInBar === 0 || stepInBar === 6) {
          this.playStaccato(chord.root, 0.05, time);
        }
        
        // アルペジオ（タ・タ・タ の 2, 3 番目）
        if (stepInBar % 3 === 1) { // 各拍の2つ目
          this.playStaccato(chord.notes[1], 0.03, time);
        } else if (stepInBar % 3 === 2) { // 各拍の3つ目
          this.playStaccato(chord.notes[2], 0.03, time);
        }
        
        // メロディの装飾（小節の終わりにキラッとする音）
        if (stepInBar === 11) {
          this.playStaccato(chord.notes[3], 0.04, time);
        }
      }
    }

    // === 新生スタッカート（ワルツ）用メソッド ===
    
    // ポッという短く切れるスタッカート音（3連符用）
    playStaccato(freq, volume, time) {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sine'; // 耳に響かないサイン波
      osc.frequency.value = freq;
      
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(volume, time + 0.015); // 極めて短いアタック
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.1); // すぐに消えるリリース
      
      osc.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      osc.start(time);
      osc.stop(time + 0.15);
    }

    playPianoNote(freq, startTime, duration, vol, destinationNode) {
      if (!this.ctx) return;
      // 基音
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = freq;
      
      // 第2倍音
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freq * 2;
      
      // 第3倍音 (アタック感と金属的な響き)
      const osc3 = this.ctx.createOscillator();
      osc3.type = 'triangle';
      osc3.frequency.value = freq * 3;

      // 音の丸みを作るローパスフィルター
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 4, startTime);
      filter.frequency.exponentialRampToValueAtTime(freq, startTime + 0.3);

      const g = this.ctx.createGain();
      
      // ピアノ特有のエンベロープ
      g.gain.setValueAtTime(0, startTime);
      g.gain.linearRampToValueAtTime(vol, startTime + 0.015);
      g.gain.exponentialRampToValueAtTime(vol * 0.2, startTime + 0.2);
      g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(g);
      g.connect(destinationNode);
      
      osc1.start(startTime);
      osc2.start(startTime);
      osc3.start(startTime);
      osc1.stop(startTime + duration + 0.1);
      osc2.stop(startTime + duration + 0.1);
      osc3.stop(startTime + duration + 0.1);
    }

    // 学校のピアノ風SE（探索ボタンなどで使用）
    playPianoSE() {
      this.init(); // BGM用のノードを含めてシステム全体を初期化する
      if (!this.ctx) return;
      
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const seGain = this.ctx.createGain();
      seGain.gain.setValueAtTime(0.01, now); // 音量をさらに半分に調整
      
      // リバーブ感を出すための簡単なディレイ
      const delay = this.ctx.createDelay();
      delay.delayTime.value = 0.3;
      const delayGain = this.ctx.createGain();
      delayGain.gain.value = 0.3;
      
      seGain.connect(this.ctx.destination);
      seGain.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(this.masterGain);
      // delayGain.connect(this.delayNode); // BGMのエコー削除

      // 不気味な3音のアルペジオ (A4 -> C5 -> E5) 「タ・タ・タン」
      const notes = [
        { freq: 440.00, timeOffset: 0.0, duration: 1.0 }, // 1音目
        { freq: 523.25, timeOffset: 0.2, duration: 1.0 }, // 2音目
        { freq: 659.25, timeOffset: 0.4, duration: 3.0 }  // 3音目（長く響かせる）
      ];
      
      notes.forEach(note => {
        this.playPianoNote(note.freq, now + note.timeOffset, note.duration, 1.0, seGain);
      });
    }

    // 校舎選択のホバー時SE（西校舎は少し低め、東校舎は少し高めの音）
    playHoverSE(type) {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const seGain = this.ctx.createGain();
      seGain.gain.setValueAtTime(0.015, now); // 小さめの音量
      seGain.connect(this.ctx.destination);

      const freq = type === 'A' ? 349.23 : 440.00; // 西(A): F4, 東(B): A4
      this.playPianoNote(freq, now, 0.5, 1.0, seGain);
    }

    // 正解効果音：ピンポン（高→さらに高い2音のサイン波）
    playCorrect() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const se = this.ctx.createGain();
      se.gain.setValueAtTime(0.22, now); // 半減した音量を維持
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
      se.gain.setValueAtTime(0.17, now);
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
        const baseVol = this.isTension ? this.defaultVolume * 0.66 : this.defaultVolume;
        const targetVol = this.isMuted ? 0 : baseVol;
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 0.3);
      }
      return this.isMuted;
    }
  }

  const bgm = new NightSchoolBGM();

  // --- 全イベントリスナーの登録 ---

  // タイトル画面のスタートボタンで画面遷移とピアノSE
  btnStartGame.addEventListener('click', () => {
    bgm.playPianoSE();
    switchScreen(titleScreen, selectionScreen);
  });

  // キャラクター選択イベント（ホバー音とクリック画面遷移）
  routePlayerA.addEventListener('mouseenter', () => {
    bgm.playHoverSE('A');
  });
  
  routePlayerA.addEventListener('click', () => {
    bgm.playPianoSE();
    switchScreen(selectionScreen, playerAScreen);
    unlockedFloorA = 4;
    currentRoomA = 'rooftop';
    renderMap();
    updateRoomUI('a', roomsWest['rooftop'], 'rooftop');
    
    bgm.start();
    if (unlockedFloorA === 0) bgm.switchToTensionMode();
    else bgm.switchToNormalMode();
  });

  routePlayerB.addEventListener('mouseenter', () => {
    bgm.playHoverSE('B');
  });

  routePlayerB.addEventListener('click', () => {
    bgm.playPianoSE();
    switchScreen(selectionScreen, playerBScreen);
    unlockedFloorB = 4;
    currentRoomB = 'rooftop';
    renderMap();
    updateRoomUI('b', roomsEast['rooftop'], 'rooftop');

    bgm.start();
    if (unlockedFloorB === 0) bgm.switchToTensionMode();
    else bgm.switchToNormalMode();
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

  // HINTボタンイベント登録
  const btnHintA = document.getElementById('btn-hint-a');
  const btnHintB = document.getElementById('btn-hint-b');

  function showHintAlert(player, currentRoomKey, roomsMap) {
    const roomData = roomsMap[currentRoomKey] || roomsMap['default'];
    const hintMessage = roomData.hint || 'この部屋の謎を解くための手がかりは、相方の画面に隠されているかもしれない。お互いの画面に何が見えるか声に出して共有してみよう！';
    showCustomAlert(`💡【ヒント】\n${hintMessage}`);
  }

  if (btnHintA) {
    btnHintA.addEventListener('click', () => {
      showHintAlert('a', currentRoomA, roomsWest);
    });
  }

  if (btnHintB) {
    btnHintB.addEventListener('click', () => {
      showHintAlert('b', currentRoomB, roomsEast);
    });
  }

});
