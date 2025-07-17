/**
 * 介護支援専門員試験学習システム - メインアプリケーション
 */
class ExamApp {
    constructor() {
        this.allYearsData = null;
        this.currentExamManager = null;
        this.selectedYear = null;
        this.currentMode = null; // 'full', 'random', 'review'
        this.wrongAnswersDB = {}; // 年度別間違い問題データベース
        this.correctAnswersDB = {}; // 年度別正解問題データベース
        this.randomQuestionPool = [];
        this.currentRandomIndex = 0;
        this.showingAnswer = false;
        this.tempUserAnswer = [];
        
        // モジュールの初期化
        this.dataLoader = new DataLoader();
        this.uiRenderer = new UIRenderer();
        this.examController = null; // init.jsで初期化される
        this.choiceController = null; // init.jsで初期化される
        
        this.loadWrongAnswersFromStorage();
        this.loadCorrectAnswersFromStorage();
        this.setupEventListeners();
    }
    
    /**
     * アプリケーション初期化
     */
    async initialize() {
        this.uiRenderer.showLoading();
        try {
            this.allYearsData = await this.dataLoader.loadAllYearsData();
            this.showYearSelection();
        } catch (error) {
            console.error('初期化エラー:', error);
            notificationSystem.showError('データの読み込みに失敗しました');
        }
    }
    
    /**
     * 年度選択画面表示
     */
    showYearSelection() {
        // 結果画面を確実に非表示にする
        const resultsDisplay = document.getElementById('results-display');
        if (resultsDisplay) {
            resultsDisplay.style.display = 'none';
            resultsDisplay.innerHTML = ''; // 内容もクリア
        }
        
        this.uiRenderer.showScreen('year-selection');
        this.uiRenderer.renderYearSelection(this.allYearsData, this);
    }
    
    /**
     * 年度選択
     */
    selectYear(year) {
        console.log(`Year selected: ${year}`);
        this.selectedYear = year;
        this.showModeSelection();
    }
    
    /**
     * モード選択画面表示
     */
    showModeSelection() {
        // 結果画面を確実に非表示にする
        const resultsDisplay = document.getElementById('results-display');
        if (resultsDisplay) {
            resultsDisplay.style.display = 'none';
            resultsDisplay.innerHTML = ''; // 内容もクリア
        }
        
        const yearData = this.allYearsData.data[this.selectedYear];
        if (!yearData) {
            console.error('Selected year data not found:', this.selectedYear);
            return;
        }
        
        // 表示用の年度情報を追加
        yearData.displayYear = this.allYearsData.years.find(y => y.year === this.selectedYear)?.name || this.selectedYear;
        
        this.uiRenderer.showScreen('mode-selection');
        this.uiRenderer.renderModeSelection(yearData, this);
    }
    
    /**
     * 完全試験モード開始
     */
    startFullExam() {
        console.log('Starting full exam mode');
        this.currentMode = 'full';
        
        const yearData = this.allYearsData.data[this.selectedYear];
        this.currentExamManager = new ExamManagerWithJudgment(yearData, this.selectedYear);
        
        this.uiRenderer.showScreen('question-interface');
        
        // examControllerが初期化されているかチェック
        if (!this.examController) {
            console.error('ExamController not initialized');
            notificationSystem.showError('システムの初期化が完了していません。しばらく待ってから再試行してください。');
            return;
        }
        
        this.examController.startFullExam(this.currentExamManager);
    }
    
    /**
     * ランダム問題モード開始
     */
    startRandomQuestion() {
        console.log('Starting random question mode');
        this.currentMode = 'random';
        this.showingAnswer = false;
        this.tempUserAnswer = []; // 選択状態をリセット
        
        const yearData = this.allYearsData.data[this.selectedYear];
        this.currentExamManager = new ExamManagerWithJudgment(yearData, this.selectedYear);
        
        // 全問題をランダムにシャッフル
        this.randomQuestionPool = this.currentExamManager.getAllQuestions();
        this.shuffleArray(this.randomQuestionPool);
        this.currentRandomIndex = 0;
        
        this.uiRenderer.showScreen('question-interface');
        
        // examControllerが初期化されているかチェック
        if (!this.examController) {
            console.error('ExamController not initialized');
            notificationSystem.showError('システムの初期化が完了していません。しばらく待ってから再試行してください。');
            return;
        }
        
        this.examController.startRandomMode(this);
    }
    
    /**
     * 間違い問題復習モード開始
     */
    startWrongQuestionReview() {
        console.log('Starting wrong question review mode');
        console.log('Selected year:', this.selectedYear);
        console.log('wrongAnswersDB:', this.wrongAnswersDB);
        console.log('wrongAnswersDB for current year:', this.wrongAnswersDB[this.selectedYear]);
        
        this.currentMode = 'review';
        this.showingAnswer = false;
        this.tempUserAnswer = []; // 選択状態をリセット
        
        const wrongQuestions = this.getWrongQuestions();
        console.log('Wrong questions found:', wrongQuestions.length);
        console.log('Wrong questions:', wrongQuestions);
        
        if (wrongQuestions.length === 0) {
            // デバッグ情報を含むメッセージを表示
            const debugInfo = `
復習する間違い問題がありません。

デバッグ情報:
- 選択年度: ${this.selectedYear}
- wrongAnswersDB: ${JSON.stringify(this.wrongAnswersDB)}
- 現在年度の間違い: ${this.wrongAnswersDB[this.selectedYear] ? Array.from(this.wrongAnswersDB[this.selectedYear]).join(', ') : 'なし'}

試験を完了すると間違い問題が記録されます。

テスト用に1-5番の問題を間違い問題として追加しますか？
            `.trim();
            
            console.log('❌ No wrong questions available');
            notificationSystem.showConfirm(debugInfo, '間違い問題がありません').then((confirmed) => {
                if (confirmed) {
                    // テスト用間違い問題を追加
                    this.addTestWrongQuestions();
                    // 再帰的に復習開始を試行
                    this.startWrongQuestionReview();
                }
            });
            return;
        }
        
        const yearData = this.allYearsData.data[this.selectedYear];
        this.currentExamManager = new ExamManagerWithJudgment(yearData, this.selectedYear);
        
        this.randomQuestionPool = wrongQuestions;
        this.shuffleArray(this.randomQuestionPool);
        this.currentRandomIndex = 0;
        
        this.uiRenderer.showScreen('question-interface');
        
        // examControllerが初期化されているかチェック
        if (!this.examController) {
            console.error('ExamController not initialized');
            notificationSystem.showError('システムの初期化が完了していません。しばらく待ってから再試行してください。');
            return;
        }
        
        this.examController.startRandomMode(this);
    }
    
    /**
     * モード選択画面に戻る
     */
    backToModeSelection() {
        console.log('Back to mode selection');
        
        // 結果画面を確実に非表示にする
        const resultsDisplay = document.getElementById('results-display');
        if (resultsDisplay) {
            resultsDisplay.style.display = 'none';
            resultsDisplay.innerHTML = ''; // 内容もクリア
        }
        
        this.currentExamManager = null;
        this.currentMode = null;
        this.showingAnswer = false;
        this.tempUserAnswer = [];
        this.showModeSelection();
    }

    /**
     * 学習統計表示
     */
    showStatistics() {
        console.log('📊 showStatistics called');
        
        // すべての画面を非表示にしてから統計画面を表示
        this.uiRenderer.hideAllScreens();
        
        // statistics-displayを表示
        const statisticsDisplay = document.getElementById('statistics-display');
        if (!statisticsDisplay) {
            console.error('❌ statistics-display element not found!');
            notificationSystem.showError('統計表示エリアが見つかりません');
            return;
        }
        
        statisticsDisplay.style.display = 'block';
        
        // 統計データを生成
        const statsData = this.generateStatisticsData();
        
        // 統計画面のHTMLを生成
        statisticsDisplay.innerHTML = this.generateStatisticsHTML(statsData);
        
        // 上部にスクロール
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log('✅ Statistics display completed');
    }
    
    /**
     * 統計データを生成
     */
    generateStatisticsData() {
        const yearData = this.allYearsData.data[this.selectedYear];
        const totalQuestions = Object.keys(yearData.questions).length;
        
        // 間違い問題数を取得
        const wrongCount = this.getWrongQuestionCount();
        
        // 正解問題数を取得（実際に正解した問題の数）
        const correctCount = this.getCorrectQuestionCount();
        
        // 解答済み問題数
        const answeredCount = correctCount + wrongCount;
        
        // 正答率は解答済み問題に対する割合
        const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
        
        // 分野別統計
        const careQuestions = Object.values(yearData.questions).filter(q => q.field === 'care_support');
        const healthQuestions = Object.values(yearData.questions).filter(q => q.field === 'health_welfare_service');
        
        const wrongSet = this.wrongAnswersDB[this.selectedYear] || new Set();
        const correctSet = this.correctAnswersDB[this.selectedYear] || new Set();
        
        // 分野別の間違い数と正解数を計算
        const careWrong = careQuestions.filter(q => {
            const questionId = q.id || parseInt(Object.keys(yearData.questions).find(key => yearData.questions[key] === q));
            return wrongSet.has(questionId);
        }).length;
        
        const healthWrong = healthQuestions.filter(q => {
            const questionId = q.id || parseInt(Object.keys(yearData.questions).find(key => yearData.questions[key] === q));
            return wrongSet.has(questionId);
        }).length;
        
        const careCorrect = careQuestions.filter(q => {
            const questionId = q.id || parseInt(Object.keys(yearData.questions).find(key => yearData.questions[key] === q));
            return correctSet.has(questionId);
        }).length;
        
        const healthCorrect = healthQuestions.filter(q => {
            const questionId = q.id || parseInt(Object.keys(yearData.questions).find(key => yearData.questions[key] === q));
            return correctSet.has(questionId);
        }).length;
        
        // 分野別の解答済み問題数と正答率
        const careAnswered = careCorrect + careWrong;
        const healthAnswered = healthCorrect + healthWrong;
        
        return {
            yearInfo: {
                year: this.selectedYear,
                displayYear: yearData.displayYear || this.selectedYear
            },
            overall: {
                total: totalQuestions,
                correct: correctCount,
                wrong: wrongCount,
                answered: answeredCount,
                accuracy: accuracy
            },
            sections: [
                {
                    name: '介護支援分野',
                    total: careQuestions.length,
                    correct: careCorrect,
                    wrong: careWrong,
                    answered: careAnswered,
                    accuracy: careAnswered > 0 ? Math.round((careCorrect / careAnswered) * 100) : 0,
                    passingScore: Math.ceil(careQuestions.length * 0.7),
                    isPassed: careCorrect >= Math.ceil(careQuestions.length * 0.7)
                },
                {
                    name: '保健医療福祉サービス分野',
                    total: healthQuestions.length,
                    correct: healthCorrect,
                    wrong: healthWrong,
                    answered: healthAnswered,
                    accuracy: healthAnswered > 0 ? Math.round((healthCorrect / healthAnswered) * 100) : 0,
                    passingScore: Math.ceil(healthQuestions.length * 0.7),
                    isPassed: healthCorrect >= Math.ceil(healthQuestions.length * 0.7)
                }
            ]
        };
    }
    
    /**
     * 統計画面HTMLを生成
     */
    generateStatisticsHTML(statsData) {
        return `
            <div class="statistics-container">
                <div class="statistics-header">
                    <h2>📊 学習統計</h2>
                    <p>${statsData.yearInfo.displayYear}</p>
                </div>
                
                <div class="overall-stats">
                    <h3>📈 全体統計</h3>
                    <div class="stats-grid">
                        <div class="stat-card ${statsData.overall.accuracy >= 70 ? 'stat-good' : 'stat-warning'}">
                            <div class="stat-number">${statsData.overall.accuracy}%</div>
                            <div class="stat-label">正答率</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${statsData.overall.correct}</div>
                            <div class="stat-label">正解問題</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${statsData.overall.wrong}</div>
                            <div class="stat-label">間違い問題</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${statsData.overall.answered}</div>
                            <div class="stat-label">解答済み問題</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${statsData.overall.total}</div>
                            <div class="stat-label">総問題数</div>
                        </div>
                    </div>
                </div>
                
                <div class="section-stats">
                    <h3>📚 分野別統計</h3>
                    <div class="sections-grid">
                        ${statsData.sections.map(section => `
                            <div class="section-card">
                                <div class="section-header">
                                    <h4>${section.name}</h4>
                                    <div class="section-accuracy ${section.isPassed ? 'passed' : 'failed'}">
                                        ${section.accuracy}%
                                    </div>
                                </div>
                                <div class="section-details">
                                    <div class="detail-row">
                                        <span>正解</span>
                                        <span>${section.correct}/${section.answered}問</span>
                                    </div>
                                    <div class="detail-row">
                                        <span>間違い</span>
                                        <span>${section.wrong}問</span>
                                    </div>
                                    <div class="detail-row">
                                        <span>解答済み</span>
                                        <span>${section.answered}/${section.total}問</span>
                                    </div>
                                    <div class="detail-row">
                                        <span>合格基準</span>
                                        <span>${section.passingScore}問以上 (70%)</span>
                                    </div>
                                    <div class="section-status ${section.isPassed ? 'passed' : 'failed'}">
                                        ${section.isPassed ? '✅ 合格基準達成' : '❌ 合格基準未達成'}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                ${statsData.overall.correct === statsData.overall.total ? `
                    <div class="action-section">
                        <h3>� 完璧です！</h3>
                        <p>全60問すべて正解しています。試験に挑戦してみましょう！</p>
                        <div class="action-buttons">
                            <button class="action-btn primary" onclick="app.startFullExam()">
                                📝 完全試験に挑戦
                            </button>
                        </div>
                    </div>
                ` : statsData.overall.wrong > 0 ? `
                    <div class="action-section">
                        <h3>🎯 学習アクション</h3>
                        <div class="action-buttons">
                            <button class="action-btn primary" onclick="app.startWrongQuestionReview()">
                                ❌ 間違い問題を復習 (${statsData.overall.wrong}問)
                            </button>
                            <button class="action-btn secondary" onclick="app.startSequentialStudy()">
                                📚 順次学習で復習
                            </button>
                            <button class="action-btn" onclick="app.startRandomQuestion()">
                                🎲 ランダム学習
                            </button>
                        </div>
                    </div>
                ` : `
                    <div class="action-section">
                        <h3>📚 学習を始めましょう</h3>
                        <p>まだ問題に答えていません。学習を開始してください。</p>
                        <div class="action-buttons">
                            <button class="action-btn primary" onclick="app.startFullExam()">
                                📝 完全試験に挑戦
                            </button>
                            <button class="action-btn secondary" onclick="app.startSequentialStudy()">
                                📚 順次学習
                            </button>
                            <button class="action-btn" onclick="app.startRandomQuestion()">
                                🎲 ランダム学習
                            </button>
                        </div>
                    </div>
                `}
                
                <div class="navigation-section">
                    <button class="nav-btn" onclick="app.backToModeSelection()">モード選択に戻る</button>
                    <button class="nav-btn" onclick="app.showYearSelection()">年度選択に戻る</button>
                </div>
            </div>
        `;
    }

    /**
     * 正解問題データベース管理
     */
    loadCorrectAnswersFromStorage() {
        try {
            const stored = localStorage.getItem('examCorrectAnswers');
            const data = stored ? JSON.parse(stored) : {};
            
            // 各年度のデータをSetに変換
            this.correctAnswersDB = {};
            Object.keys(data).forEach(year => {
                if (Array.isArray(data[year])) {
                    this.correctAnswersDB[year] = new Set(data[year]);
                } else if (data[year] instanceof Set) {
                    this.correctAnswersDB[year] = data[year];
                } else {
                    // オブジェクトの場合は空のSetで初期化
                    this.correctAnswersDB[year] = new Set();
                }
            });
        } catch (error) {
            console.error('正解問題データの読み込みに失敗:', error);
            this.correctAnswersDB = {};
        }
    }

    saveCorrectAnswersToStorage() {
        try {
            // Setオブジェクトを配列に変換して保存
            const dataToSave = {};
            Object.keys(this.correctAnswersDB).forEach(year => {
                if (this.correctAnswersDB[year] instanceof Set) {
                    dataToSave[year] = Array.from(this.correctAnswersDB[year]);
                } else {
                    dataToSave[year] = [];
                }
            });
            localStorage.setItem('examCorrectAnswers', JSON.stringify(dataToSave));
        } catch (error) {
            console.error('正解問題データの保存に失敗:', error);
        }
    }

    /**
     * 間違い問題データベース管理
     */    loadWrongAnswersFromStorage() {
        try {
            const stored = localStorage.getItem('examWrongAnswers');
            const data = stored ? JSON.parse(stored) : {};
            
            // 各年度のデータをSetに変換
            this.wrongAnswersDB = {};
            Object.keys(data).forEach(year => {
                if (Array.isArray(data[year])) {
                    this.wrongAnswersDB[year] = new Set(data[year]);
                } else if (data[year] instanceof Set) {
                    this.wrongAnswersDB[year] = data[year];
                } else {
                    // オブジェクトの場合は空のSetで初期化
                    this.wrongAnswersDB[year] = new Set();
                }
            });
        } catch (error) {
            console.error('間違い問題データの読み込みに失敗:', error);
            this.wrongAnswersDB = {};
        }
    }

    saveWrongAnswersToStorage() {
        try {
            // Setオブジェクトを配列に変換して保存
            const dataToSave = {};
            Object.keys(this.wrongAnswersDB).forEach(year => {
                if (this.wrongAnswersDB[year] instanceof Set) {
                    dataToSave[year] = Array.from(this.wrongAnswersDB[year]);
                } else {
                    dataToSave[year] = [];
                }
            });
            localStorage.setItem('examWrongAnswers', JSON.stringify(dataToSave));
        } catch (error) {
            console.error('間違い問題データの保存に失敗:', error);
        }
    }
    
    /**
     * 正解問題を記録
     */
    recordCorrectAnswer(questionId) {
        if (!this.correctAnswersDB[this.selectedYear]) {
            this.correctAnswersDB[this.selectedYear] = new Set();
        }
        
        this.correctAnswersDB[this.selectedYear].add(questionId);
        
        // 間違いデータベースからは削除
        if (this.wrongAnswersDB[this.selectedYear]) {
            this.wrongAnswersDB[this.selectedYear].delete(questionId);
        }
        
        this.saveCorrectAnswersToStorage();
        this.saveWrongAnswersToStorage();
    }
    
    /**
     * 間違い問題を記録
     */
    recordWrongAnswer(questionId) {
        if (!this.wrongAnswersDB[this.selectedYear]) {
            this.wrongAnswersDB[this.selectedYear] = new Set();
        }
        
        this.wrongAnswersDB[this.selectedYear].add(questionId);
        
        // 正解データベースからは削除
        if (this.correctAnswersDB[this.selectedYear]) {
            this.correctAnswersDB[this.selectedYear].delete(questionId);
        }
        
        this.saveWrongAnswersToStorage();
        this.saveCorrectAnswersToStorage();
    }
    
    /**
     * 間違い問題を削除（復習モードで正解した際に使用）
     */
    removeWrongAnswer(questionId) {
        if (this.wrongAnswersDB[this.selectedYear]) {
            this.wrongAnswersDB[this.selectedYear].delete(questionId);
            this.saveWrongAnswersToStorage();
        }
    }
    
    removeCorrectAnswer(questionId) {
        if (this.correctAnswersDB[this.selectedYear]) {
            this.correctAnswersDB[this.selectedYear].delete(questionId);
            this.saveCorrectAnswersToStorage();
        }
        
        // 間違い問題データベースに移動
        if (!this.wrongAnswersDB[this.selectedYear]) {
            this.wrongAnswersDB[this.selectedYear] = new Set();
        }
        this.wrongAnswersDB[this.selectedYear].add(questionId);
        this.saveWrongAnswersToStorage();
    }
    
    getWrongQuestionCount() {
        if (!this.wrongAnswersDB[this.selectedYear]) return 0;
        return this.wrongAnswersDB[this.selectedYear].size || 0;
    }
    
    /**
     * 問題の正解選択肢数を動的に計算
     */
    getSelectCount(questionId) {
        // answersデータがある場合は、正解の選択肢数を使用
        if (this.allYearsData && this.allYearsData.data[this.selectedYear] && this.allYearsData.data[this.selectedYear].answers) {
            const answersData = this.allYearsData.data[this.selectedYear].answers;
            let correctAnswers = null;
            
            // 介護支援分野（問題1-25）
            if (questionId <= 25 && answersData.care_support_field) {
                correctAnswers = answersData.care_support_field[questionId.toString()];
            }
            // 保健医療福祉サービス分野（問題26-60）
            else if (questionId >= 26 && answersData.health_welfare_service_field) {
                correctAnswers = answersData.health_welfare_service_field[questionId.toString()];
            }
            
            if (correctAnswers && Array.isArray(correctAnswers)) {
                return correctAnswers.length;
            }
        }
        
        // answersデータがない場合のデフォルト値も動的に計算
        // デフォルト値は3（最も一般的な選択数）
        return 3;
    }
    
    /**
     * 正解問題数を取得
     */
    getCorrectQuestionCount() {
        if (!this.correctAnswersDB[this.selectedYear]) return 0;
        return this.correctAnswersDB[this.selectedYear].size || 0;
    }

    getWrongQuestions() {
        console.log('🔍 getWrongQuestions called');
        console.log('Selected year:', this.selectedYear);
        console.log('wrongAnswersDB:', this.wrongAnswersDB);
        
        if (!this.wrongAnswersDB[this.selectedYear]) {
            console.log('❌ No wrong answers for current year');
            return [];
        }
        
        const wrongIds = Array.from(this.wrongAnswersDB[this.selectedYear]);
        console.log('Wrong IDs from DB:', wrongIds);
        
        if (wrongIds.length === 0) {
            console.log('❌ Wrong IDs array is empty');
            return [];
        }
        
        const yearData = this.allYearsData.data[this.selectedYear];
        console.log('Year data available:', !!yearData);
        console.log('Questions available:', !!yearData?.questions);
        
        if (!yearData || !yearData.questions) {
            console.log('❌ Year data or questions not available');
            return [];
        }
        
        const questions = wrongIds.map(id => {
            const questionId = parseInt(id);
            const question = yearData.questions[questionId];
            console.log(`Question ${questionId}:`, !!question);
            
            if (question) {
                return {
                    id: questionId,
                    questionText: question.question_text,
                    choices: question.choices,
                    selectCount: this.getSelectCount(questionId),
                    field: question.field,
                    correctAnswers: this.getCorrectAnswers(questionId),
                    section: this.getSectionName(question.field)
                };
            }
            return null;
        }).filter(Boolean);
        
        console.log('Final questions array:', questions);
        console.log('Final questions count:', questions.length);
        return questions;
    }
    
    getCorrectAnswers(questionId) {
        const yearData = this.allYearsData.data[this.selectedYear];
        if (!yearData.answers) return [];
        
        // フィールドを特定
        if (parseInt(questionId) <= 25) {
            return yearData.answers.care_support_field[questionId] || [];
        } else {
            return yearData.answers.health_welfare_service_field[questionId] || [];
        }
    }
    
    getSectionName(field) {
        const fieldMap = {
            'care_support': '介護支援分野',
            'health_welfare_service': '保健医療福祉サービス分野'
        };
        return fieldMap[field] || field;
    }
    
    /**
     * テスト用間違い問題を追加
     */
    addTestWrongQuestions() {
        console.log('🧪 Adding test wrong questions');
        
        if (!this.wrongAnswersDB[this.selectedYear]) {
            this.wrongAnswersDB[this.selectedYear] = new Set();
        }
        
        // 1-5番の問題を間違い問題として追加
        [1, 2, 3, 4, 5].forEach(id => {
            this.wrongAnswersDB[this.selectedYear].add(id);
        });
        
        this.saveWrongAnswersToStorage();
        console.log('✅ Test wrong questions added:', Array.from(this.wrongAnswersDB[this.selectedYear]));
    }

    /**
     * 順次学習モード開始
     */
    startSequentialStudy() {
        console.log('Starting sequential study mode');
        this.currentMode = 'sequential';
        this.showingAnswer = false;
        this.tempUserAnswer = []; // 選択状態をリセット
        
        const yearData = this.allYearsData.data[this.selectedYear];
        this.currentExamManager = new ExamManagerWithJudgment(yearData, this.selectedYear);
        
        // 全問題を1問目から順番に並べる
        this.randomQuestionPool = this.currentExamManager.getAllQuestions();
        // 順次モードなので並び替えは不要
        this.currentRandomIndex = 0;
        
        this.uiRenderer.showScreen('question-interface');
        
        // examControllerが初期化されているかチェック
        if (!this.examController) {
            console.error('ExamController not initialized');
            notificationSystem.showError('システムの初期化が完了していません。しばらく待ってから再試行してください。');
            return;
        }
        
        this.examController.startSequentialMode(this);
    }

    /**
     * 学習状況をリセット
     */
    async resetLearningData() {
        const confirmed = await notificationSystem.showConfirm(
            '⚠️ 学習状況をリセットしますか？\n\n' +
            '以下のデータが削除されます：\n' +
            '• 全年度の正解記録\n' +
            '• 全年度の間違い記録\n' +
            '• 学習進捗データ\n\n' +
            'この操作は元に戻せません。',
            '学習データリセット'
        );
        
        if (!confirmed) {
            return;
        }
        
        try {
            // LocalStorageから学習データを削除
            localStorage.removeItem('examCorrectAnswers');
            localStorage.removeItem('examWrongAnswers');
            
            // インメモリのデータもリセット
            this.correctAnswersDB = {};
            this.wrongAnswersDB = {};
            
            // 成功メッセージを表示
            notificationSystem.showSuccess('学習状況をリセットしました！\n新しい学習を始めることができます。');
            
            // 年度選択画面を再表示（画面をリフレッシュ）
            this.showYearSelection();
            
        } catch (error) {
            console.error('学習データリセット中にエラーが発生:', error);
            notificationSystem.showError('学習データのリセット中にエラーが発生しました。');
        }
    }

    /**
     * ユーティリティ関数
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    setupEventListeners() {
        // 必要に応じてグローバルイベントリスナーを設定
    }
}

// アプリケーション開始
const app = new ExamApp();
window.app = app;

// グローバル関数
window.autoAnswerQuestions = function() {
    if (app.examController) {
        app.examController.autoAnswerQuestions();
    } else {
        notificationSystem.showError('システムが初期化されていません');
    }
};

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
    app.initialize();
});

// アプリケーション開始
