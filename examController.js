/**
 * 試験実行機能モジュール
 */
class ExamController {
    constructor(app) {
        this.app = app;
    }
    
    /**
     * 完全試験モード開始
     */
    startFullExam() {
        console.log('startFullExam called');
        this.app.currentMode = 'full';
        
        if (!this.app.currentExamManager) {
            notificationSystem.showError('試験データが初期化されていません');
            return;
        }
        
        this.app.currentExamManager.startExam();
        console.log('Exam started, showing question interface...');
        
        this.showQuestionInterface();
    }
    
    /**
     * ランダムモード開始（app.jsから呼び出し用）
     */
    startRandomMode(app) {
        this.showQuestionInterface();
        this.renderRandomQuestion();
    }

    /**
     * 順次学習モード開始（app.jsから呼び出し用）
     */
    startSequentialMode(app) {
        this.showQuestionInterface();
        this.renderSequentialQuestion();
    }

    /**
     * ランダム1問チャレンジ開始
     */
    startRandomQuestion() {
        this.app.currentMode = 'random';
        
        // ランダム問題プールを作成
        this.app.randomQuestionPool = [...this.app.currentExamManager.questionList];
        this.shuffleArray(this.app.randomQuestionPool);
        this.app.currentRandomIndex = 0;
        this.app.showingAnswer = false;
        this.app.tempUserAnswer = []; // 選択状態をリセット
        
        this.showQuestionInterface();
        this.renderRandomQuestion();
    }
    
    /**
     * 間違い問題復習モード開始
     */
    startWrongQuestionReview() {
        const wrongAnswersSet = this.app.wrongAnswersDB[this.app.selectedYear] || new Set();
        if (wrongAnswersSet.size === 0) {
            notificationSystem.showWarning('間違えた問題がありません。先に試験を受けてください。');
            return;
        }
        
        this.app.currentMode = 'review';
        
        // 間違い問題のみのプールを作成
        this.app.randomQuestionPool = this.app.currentExamManager.questionList.filter(q => 
            wrongAnswersSet.has(q.id)
        );
        this.shuffleArray(this.app.randomQuestionPool);
        this.app.currentRandomIndex = 0;
        this.app.showingAnswer = false;
        
        this.showQuestionInterface();
        this.renderRandomQuestion();
    }
    
    /**
     * 問題画面を表示
     */
    showQuestionInterface() {
        this.app.uiRenderer.hideAllScreens();
        document.getElementById('question-interface').style.display = 'block';
        
        // 問題インターフェースの基本構造を作成
        const container = document.getElementById('question-interface');
        container.innerHTML = `
            <div id="question-content"></div>
            <div class="navigation" id="navigation-buttons"></div>
        `;
        
        // 問題が見やすい位置にスクロール
        setTimeout(() => this.scrollToQuestion(), 100);
        
        // モードに応じた初期描画
        if (this.app.currentMode === 'full') {
            this.renderCurrentQuestion();
        }
    }
    
    /**
     * 完全試験モードの問題描画
     */
    renderCurrentQuestion() {
        const question = this.app.currentExamManager.getCurrentQuestion();
        if (!question) {
            notificationSystem.showError('問題が見つかりません');
            return;
        }
        
        const currentIndex = this.app.currentExamManager.currentQuestionIndex + 1;
        const totalQuestions = this.app.currentExamManager.questionList.length;
        
        document.getElementById('question-content').innerHTML = this.renderQuestionHTML(question, currentIndex, totalQuestions);
        this.updateFullExamNavigationButtons();
    }
    
    /**
     * ランダム問題を描画
     */
    renderRandomQuestion() {
        if (this.app.currentRandomIndex >= this.app.randomQuestionPool.length) {
            this.showRandomModeComplete();
            return;
        }
        
        const question = this.app.randomQuestionPool[this.app.currentRandomIndex];
        const currentIndex = this.app.currentRandomIndex + 1;
        const totalQuestions = this.app.randomQuestionPool.length;
        
        document.getElementById('question-content').innerHTML = this.renderQuestionHTML(question, currentIndex, totalQuestions);
        this.updateRandomNavigationButtons();
    }
    
    /**
     * 順次学習問題を描画
     */
    renderSequentialQuestion() {
        if (this.app.currentRandomIndex >= this.app.randomQuestionPool.length) {
            this.showSequentialModeComplete();
            return;
        }
        
        const question = this.app.randomQuestionPool[this.app.currentRandomIndex];
        const currentIndex = this.app.currentRandomIndex + 1;
        const totalQuestions = this.app.randomQuestionPool.length;
        
        // 順次学習モードでは、正答表示中でない場合のみ選択状態をリセット
        if (!this.app.showingAnswer) {
            this.app.tempUserAnswer = [];
        }
        
        document.getElementById('question-content').innerHTML = this.renderQuestionHTML(question, currentIndex, totalQuestions);
        this.updateSequentialNavigationButtons();
    }

    /**
     * 問題HTMLを生成
     */
    renderQuestionHTML(question, currentNum, totalNum) {
        const userAnswer = this.getUserAnswerForQuestion(question.id);
        const correctAnswers = this.getCorrectAnswersForQuestion(question.id);
        const showAnswer = this.app.showingAnswer;
        const isCorrect = showAnswer && correctAnswers ? this.checkAnswerMatch(correctAnswers, userAnswer) : null;
        
        let html = `
            <div class="question-container">
                <div class="question-content">
                    <h3>問題${question.id}</h3>
                    <p class="question-text">${question.questionText}</p>
                    
                    ${question.selectCount > 1 ? 
                        `<div class="select-instruction">※ ${question.selectCount}つ選びなさい</div>` : ''}
                </div>
                
                <div class="choices-container">
        `;
        
        question.choices.forEach((choice, index) => {
            const choiceNumber = index + 1;
            const isSelected = userAnswer.includes(choiceNumber);
            const isCorrectChoice = correctAnswers && correctAnswers.includes(choiceNumber);
            
            let choiceClass = 'choice';
            if (showAnswer) {
                if (isCorrectChoice) choiceClass += ' correct';
                if (isSelected && !isCorrectChoice) choiceClass += ' incorrect';
                if (isSelected && isCorrectChoice) choiceClass += ' user-correct';
            } else if (isSelected) {
                choiceClass += ' selected';
            }
            
            html += `
                <div class="${choiceClass}" 
                     onclick="window.toggleChoice(${choiceNumber})" 
                     onmousedown="this.style.backgroundColor='#dee2e6'"
                     onmouseup="this.style.backgroundColor=''"
                     style="cursor: pointer;">
                    <span class="choice-number">${choiceNumber}</span>
                    <span class="choice-text">${choice}</span>
                    ${showAnswer && isCorrectChoice ? ' ✓' : ''}
                    ${showAnswer && isSelected && !isCorrectChoice ? ' ✗' : ''}
                </div>
            `;
        });
        
        html += '</div>';
        
        if (showAnswer && correctAnswers) {
            html += `
                <div class="answer-feedback ${isCorrect ? 'correct' : 'incorrect'}">
                    <h4>${isCorrect ? '✅ 正解' : '❌ 不正解'}</h4>
                    <p><strong>正答:</strong> ${correctAnswers.join(', ')}</p>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }
    
    /**
     * 配列をシャッフル
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    /**
     * ユーザーの回答を取得
     */
    getUserAnswerForQuestion(questionId) {
        if (this.app.currentMode === 'full') {
            return this.app.currentExamManager.userAnswers.get(questionId) || [];
        } else {
            // ランダムモード用の一時的な回答保存
            return this.app.tempUserAnswer || [];
        }
    }
    
    /**
     * 正答を取得（将来的に別ファイルから読み込み）
     */
    getCorrectAnswersForQuestion(questionId) {
        // allYearsDataから現在選択されている年度のデータを取得
        const currentYearData = this.app.allYearsData?.data?.[this.app.selectedYear];
        
        // JSONファイルのanswersセクションから正答を取得
        if (!currentYearData?.answers) {
            return null;
        }
        
        const answers = currentYearData.answers;
        let result = null;
        
        // 問題IDに基づいて適切な分野から正答を取得
        // 問題1-25: care_support_field
        // 問題26-60: health_welfare_service_field
        if (questionId >= 1 && questionId <= 25) {
            result = answers.care_support_field?.[questionId.toString()] || null;
        } else if (questionId >= 26 && questionId <= 60) {
            result = answers.health_welfare_service_field?.[questionId.toString()] || null;
        }
        
        return result;
    }
    
    /**
     * 正答チェック
     */
    checkAnswerMatch(correctAnswers, userAnswers) {
        if (!correctAnswers || !userAnswers) {
            return false;
        }
        
        // 配列であることを確認
        if (!Array.isArray(correctAnswers) || !Array.isArray(userAnswers)) {
            return false;
        }
        
        const correctSet = new Set(correctAnswers);
        const userSet = new Set(userAnswers);
        
        if (correctSet.size !== userSet.size) {
            return false;
        }
        
        for (const answer of correctSet) {
            if (!userSet.has(answer)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * ランダムモード完了画面
     */
    showRandomModeComplete() {
        document.getElementById('question-content').innerHTML = `
            <div class="question-container" style="text-align: center;">
                <h2>🎉 お疲れさまでした！</h2>
                <p>すべての問題を確認しました。</p>
                <button class="nav-btn" onclick="app.startRandomQuestion()">
                    もう一度ランダム学習
                </button>
                <button class="back-button" onclick="app.backToModeSelection()">
                    モード選択に戻る
                </button>
            </div>
        `;
        document.getElementById('navigation-buttons').innerHTML = '';
    }
    
    /**
     * 順次学習モード完了画面
     */
    showSequentialModeComplete() {
        document.getElementById('question-content').innerHTML = `
            <div class="question-container" style="text-align: center;">
                <h2>🎉 順次学習完了！</h2>
                <p>全${this.app.randomQuestionPool.length}問の学習が完了しました。</p>
                <div style="margin: 20px 0;">
                    <button class="nav-btn" onclick="app.startSequentialStudy()">
                        もう一度順次学習
                    </button>
                    <button class="nav-btn" onclick="app.startFullExam()">
                        完全試験に挑戦
                    </button>
                </div>
                <button class="back-button" onclick="app.backToModeSelection()">
                    モード選択に戻る
                </button>
            </div>
        `;
        document.getElementById('navigation-buttons').innerHTML = '';
    }

    /**
     * 完全試験モードのナビゲーションボタン更新
     */
    updateFullExamNavigationButtons() {
        const navContainer = document.getElementById('navigation-buttons');
        const canGoPrev = this.app.currentExamManager.currentQuestionIndex > 0;
        const canGoNext = this.app.currentExamManager.currentQuestionIndex < this.app.currentExamManager.questionList.length - 1;
        const isLast = this.app.currentExamManager.currentQuestionIndex === this.app.currentExamManager.questionList.length - 1;
        
        navContainer.innerHTML = `
            <button class="nav-btn" onclick="app.examController.previousQuestion()" ${!canGoPrev ? 'disabled' : ''}>
                ${canGoPrev ? '← 前の問題' : '← (最初の問題)'}
            </button>
            <button class="back-button" onclick="app.backToModeSelection()">
                モード選択に戻る
            </button>
            ${isLast ? 
                '<button class="nav-btn finish" onclick="app.examController.finishExam()">🎓 試験終了</button>' :
                `<button class="nav-btn" onclick="app.examController.nextQuestion()" ${!canGoNext ? 'disabled' : ''}>
                    ${canGoNext ? '次の問題 →' : '(最後の問題) →'}
                </button>`
            }
        `;
    }
    
    /**
     * ランダムモードのナビゲーションボタン更新
     */
    updateRandomNavigationButtons() {
        const navContainer = document.getElementById('navigation-buttons');
        const isLast = this.app.currentRandomIndex === this.app.randomQuestionPool.length - 1;
        
        navContainer.innerHTML = `
            <button class="back-button" onclick="app.backToModeSelection()">
                モード選択に戻る
            </button>
            ${this.app.showingAnswer ? 
                (isLast ? 
                    '<button class="nav-btn finish" onclick="app.examController.showRandomModeComplete()">🎉 完了</button>' :
                    '<button class="nav-btn" onclick="app.examController.nextQuestionRandomMode()">次の問題 →</button>'
                ) :
                '<button class="nav-btn show-answer" onclick="if(!app.examController && window.ExamController) { app.examController = new ExamController(app); } app.examController.showAnswer();">正答を見る</button>'
            }
        `;
    }
    
    /**
     * 順次学習モードのナビゲーションボタン更新
     */
    updateSequentialNavigationButtons() {
        const navContainer = document.getElementById('navigation-buttons');
        const isLast = this.app.currentRandomIndex === this.app.randomQuestionPool.length - 1;
        const canGoPrev = this.app.currentRandomIndex > 0;
        
        navContainer.innerHTML = `
            <button class="nav-btn" onclick="app.examController.previousSequentialQuestion()" ${!canGoPrev ? 'disabled' : ''}>
                ${canGoPrev ? '← 前の問題' : '← (最初の問題)'}
            </button>
            <button class="back-button" onclick="app.backToModeSelection()">
                モード選択に戻る
            </button>
            ${this.app.showingAnswer ? 
                (isLast ? 
                    '<button class="nav-btn finish" onclick="app.examController.showSequentialModeComplete()">🎉 完了</button>' :
                    '<button class="nav-btn" onclick="app.examController.nextSequentialQuestion()">次の問題 →</button>'
                ) :
                '<button class="nav-btn show-answer" onclick="app.examController.showAnswer();">正答を見る</button>'
            }
        `;
    }

    /**
     * 次の問題（完全試験モード）
     */
    nextQuestion() {
        if (this.app.currentExamManager.nextQuestion()) {
            this.renderCurrentQuestion();
            // 問題が見やすい位置にスクロール
            this.scrollToQuestion();
        }
    }
    
    /**
     * 前の問題（完全試験モード）
     */
    previousQuestion() {
        if (this.app.currentExamManager.previousQuestion()) {
            this.renderCurrentQuestion();
            // 問題が見やすい位置にスクロール
            this.scrollToQuestion();
        }
    }
    
    /**
     * 次の問題（ランダムモード）
     */
    nextQuestionRandomMode() {
        this.app.currentRandomIndex++;
        this.app.showingAnswer = false;
        this.app.tempUserAnswer = [];
        this.renderRandomQuestion();
        // 問題が見やすい位置にスクロール
        this.scrollToQuestion();
    }
    
    /**
     * 次の問題（順次学習モード）
     */
    nextSequentialQuestion() {
        if (this.app.currentRandomIndex < this.app.randomQuestionPool.length - 1) {
            this.app.currentRandomIndex++;
            this.app.showingAnswer = false;
            this.app.tempUserAnswer = [];
            this.renderSequentialQuestion();
            // 問題が見やすい位置にスクロール
            this.scrollToQuestion();
        }
    }
    
    /**
     * 前の問題（順次学習モード）
     */
    previousSequentialQuestion() {
        if (this.app.currentRandomIndex > 0) {
            this.app.currentRandomIndex--;
            this.app.showingAnswer = false;
            this.app.tempUserAnswer = [];
            this.renderSequentialQuestion();
            // 問題が見やすい位置にスクロール
            this.scrollToQuestion();
        }
    }

    /**
     * 正答表示
     */
    showAnswer() {
        this.app.showingAnswer = true;
        
        if (this.app.currentMode === 'random' || this.app.currentMode === 'review' || this.app.currentMode === 'sequential') {
            const question = this.app.randomQuestionPool[this.app.currentRandomIndex];
            const userAnswer = this.app.tempUserAnswer || [];
            
            // 正答チェック
            const correctAnswers = this.getCorrectAnswersForQuestion(question.id);
            const isCorrect = this.checkAnswerMatch(correctAnswers, userAnswer);
            
            // 間違い問題の記録（順次学習モード以外では記録する）
            if (this.app.currentMode !== 'sequential') {
                if (!isCorrect && correctAnswers && correctAnswers.length > 0) {
                    this.app.recordWrongAnswer(question.id);
                } else if (isCorrect && correctAnswers && correctAnswers.length > 0) {
                    this.app.recordCorrectAnswer(question.id);
                    
                    // 復習モードで正解した場合は間違いデータベースからも削除
                    if (this.app.currentMode === 'review') {
                        this.app.removeWrongAnswer(question.id);
                    }
                }
            }
            
            // モードに応じた再描画
            if (this.app.currentMode === 'sequential') {
                this.renderSequentialQuestion();
            } else {
                this.renderRandomQuestion();
            }
        }
    }
    
    /**
     * 試験終了
     */
    finishExam() {
        console.log('🏁 finishExam called, currentMode:', this.app.currentMode);
        console.log('currentExamManager:', !!this.app.currentExamManager);
        
        if (this.app.currentMode === 'full') {
            console.log('Starting finishExam process...');
            const results = this.app.currentExamManager.finishExam();
            console.log('Results:', results);
            this.showResults(results);
        } else {
            console.log('Not in full mode, currentMode:', this.app.currentMode);
        }
    }
    
    /**
     * 結果表示
     */
    showResults(results) {
        console.log('📊 showResults called with:', results);
        
        // すべての画面を非表示にしてから結果画面を表示
        this.app.uiRenderer.hideAllScreens();
        
        // results-displayを表示
        const resultsDisplay = document.getElementById('results-display');
        if (!resultsDisplay) {
            console.error('❌ results-display element not found!');
            notificationSystem.showError('結果表示エリアが見つかりません');
            return;
        }
        
        resultsDisplay.style.display = 'block';
        console.log('✅ results-display set to visible');
        
        // 一時的に簡単な結果表示を実装
        if (!results) {
            console.error('❌ No results data provided');
            resultsDisplay.innerHTML = '<div class="error">結果データが取得できませんでした</div>';
            return;
        }
        
        try {
            console.log('🔄 Calling renderResults...');
            const resultsHtml = this.app.currentExamManager.renderResults(results);
            console.log('Generated HTML length:', resultsHtml?.length || 0);
            
            if (!resultsHtml || resultsHtml.length === 0) {
                console.warn('⚠️ renderResults returned empty, using fallback');
                // renderResultsが失敗した場合の基本的な結果表示
                resultsDisplay.innerHTML = this.generateBasicResults(results);
            } else {
                console.log('✅ Using rendered results HTML');
                resultsDisplay.innerHTML = resultsHtml;
            }
        } catch (error) {
            console.error('❌ renderResults error:', error);
            resultsDisplay.innerHTML = this.generateBasicResults(results);
        }
        
        // 結果画面が見えるように上部にスクロール
        window.scrollTo({ top: 0, behavior: 'smooth' });
        console.log('✅ showResults completed');
    }
    
    /**
     * 基本的な結果表示HTML生成（フォールバック用）
     */
    generateBasicResults(results) {
        const passed = results.judgment?.passed;
        const passedText = passed === null ? '判定不能' : (passed ? '✅ 合格' : '❌ 不合格');
        const passedClass = passed === null ? 'unknown' : (passed ? 'passed' : 'failed');
        
        return `
            <div class="results-container">
                <div class="results-header">
                    <h2>🎓 試験結果</h2>
                    <p>${results.examInfo?.year || ''} ${results.examInfo?.title || ''}</p>
                </div>
                
                <div class="overall-judgment ${passedClass}">
                    <h3>${passedText}</h3>
                    <p>${results.judgment?.message || ''}</p>
                </div>
                
                <div class="section-results">
                    <h4>📊 分野別結果</h4>
                    ${results.sectionResults?.map(section => `
                        <div class="section-result ${section.passed ? 'passed' : 'failed'}">
                            <h5>${section.section}</h5>
                            <p>得点: ${section.score}/${section.total}問 (${section.percentage}%)</p>
                            <p>合格基準: ${section.passingScore}問以上</p>
                        </div>
                    `).join('') || '<p>分野別結果がありません</p>'}
                </div>
                
                <div class="statistics">
                    <h4>📈 統計情報</h4>
                    <p>回答数: ${results.statistics?.answeredQuestions || 0}/${results.statistics?.totalQuestions || 0}問</p>
                    <p>所要時間: ${results.statistics?.timeTaken || 0}分</p>
                    <p>完答率: ${results.statistics?.completionRate || 0}%</p>
                </div>
                
                ${results.statistics?.wrongAnswers > 0 ? `
                    <div class="wrong-questions-section">
                        <h4>❌ 間違えた問題</h4>
                        <p>間違えた問題数: ${results.statistics.wrongAnswers}問</p>
                        <button onclick="app.startWrongQuestionReview()" class="review-button">
                            間違い問題を復習する
                        </button>
                    </div>
                ` : ''}
                
                <div class="navigation">
                    <button class="nav-btn" onclick="app.backToModeSelection()">モード選択に戻る</button>
                    <button class="nav-btn" onclick="app.showYearSelection()">年度選択に戻る</button>
                </div>
            </div>
        `;
    }

    /**
     * 問題が見やすい位置にスクロール
     */
    scrollToQuestion() {
        const questionContent = document.getElementById('question-content');
        const questionInterface = document.getElementById('question-interface');
        
        if (questionContent && questionContent.firstElementChild) {
            // 問題コンテンツが画面上部から少し下の位置に来るようにスクロール
            const contentTop = questionContent.firstElementChild.offsetTop;
            const offset = 20; // 上部に20pxの余白を作る
            
            window.scrollTo({
                top: Math.max(0, contentTop - offset),
                behavior: 'smooth'
            });
        } else if (questionInterface) {
            // フォールバック: 問題インターフェース全体の位置にスクロール
            const interfaceTop = questionInterface.offsetTop;
            const offset = 20;
            
            window.scrollTo({
                top: Math.max(0, interfaceTop - offset),
                behavior: 'smooth'
            });
        }
    }

}

// ExamControllerをグローバルに設定
if (typeof window !== 'undefined') {
    window.ExamController = ExamController;
}
