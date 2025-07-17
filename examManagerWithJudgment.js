/**
 * 合否判定機能付き介護支援専門員試験管理システム
 * 年度ごとの合格基準に基づく判定と間違い問題復習機能を提供
 */
class ExamManagerWithJudgment {
    constructor(examData, yearData = null) {
        this.examData = examData;
        this.yearData = yearData; // 年度別の合格基準情報
        this.currentQuestionIndex = 0;
        this.userAnswers = new Map();
        this.wrongAnswers = new Set(); // 間違えた問題のID
        this.reviewMode = false;
        this.wrongQuestionMode = false; // 間違い問題のみ表示モード
        this.sectionScores = new Map(); // 分野別スコア
        this.startTime = null;
        this.endTime = null;
        
        // 問題データを配列形式に変換
        this.questionList = this.convertQuestionsToArray();
        this.initializeSections();
    }
    
    /**
     * 問題データをオブジェクトから配列に変換
     */
    convertQuestionsToArray() {
        if (Array.isArray(this.examData.questions)) {
            return this.examData.questions;
        }
        
        return Object.entries(this.examData.questions).map(([id, question]) => ({
            id: parseInt(id),
            questionText: question.question_text,
            choices: question.choices,
            selectCount: this.getSelectCount(parseInt(id)),
            field: question.field,
            correctAnswers: this.getCorrectAnswersFromFile(id) || [],
            section: this.getSectionName(question.field)
        }));
    }
    
    /**
     * フィールド名からセクション名を取得
     */
    getSectionName(field) {
        const fieldMap = {
            'care_support': '介護支援分野',
            'health_welfare_service': '保健医療福祉サービス分野'
        };
        return fieldMap[field] || field;
    }
    
    /**
     * 正答データを取得（別ファイルから読み込み予定）
     */
    getCorrectAnswersFromFile(questionId) {
        // answersデータが利用可能な場合は取得
        if (this.examData.answers) {
            // 問題IDに基づいて適切な分野から正答を取得
            if (parseInt(questionId) <= 25) {
                return this.examData.answers.care_support_field?.[questionId] || [];
            } else {
                return this.examData.answers.health_welfare_service_field?.[questionId] || [];
            }
        }
        return [];
    }
    
    /**
     * 分野別の初期化
     */
    initializeSections() {
        // 標準的なケアマネ試験の分野設定
        const standardSections = [
            { name: '介護支援分野', questions: 25 },
            { name: '保健医療福祉サービス分野', questions: 35 }
        ];
        
        standardSections.forEach(section => {
            const passingScore = Math.ceil(section.questions * 0.7); // 70%基準
            this.sectionScores.set(section.name, {
                totalQuestions: section.questions,
                correctAnswers: 0,
                score: 0,
                passingScore: passingScore,
                passed: false
            });
        });
        
        console.log('📊 Initialized sections with 70% passing criteria:');
        for (const [name, score] of this.sectionScores) {
            console.log(`- ${name}: ${score.passingScore}/${score.totalQuestions}問以上`);
        }
    }
    
    /**
     * 全問題を取得
     */
    getAllQuestions() {
        return this.questionList;
    }

    /**
     * セクション別の問題数を計算
     */
    getQuestionCountForSection(sectionName) {
        return this.questionList.filter(q => q.section === sectionName).length;
    }
    
    /**
     * 分野別の合格点を取得
     */
    getPassingScore(sectionName) {
        if (!this.yearData?.passingCriteria) return null;
        return this.yearData.passingCriteria[sectionName]?.passingScore || null;
    }
    
    /**
     * 試験開始
     */
    startExam() {
        this.startTime = new Date();
        this.currentQuestionIndex = 0;
        this.userAnswers.clear();
        this.wrongAnswers.clear();
        this.resetSectionScores();
        this.wrongQuestionMode = false;
        this.reviewMode = false;
    }
    
    /**
     * 間違い問題復習モード開始
     */
    startWrongQuestionReview() {
        if (this.wrongAnswers.size === 0) {
            notificationSystem.showWarning('間違えた問題がありません。先に試験を受けてください。');
            return false;
        }
        
        this.wrongQuestionMode = true;
        this.reviewMode = true;
        this.currentQuestionIndex = 0;
        return true;
    }
    
    /**
     * 表示する問題リストを取得
     */
    getDisplayQuestions() {
        if (this.wrongQuestionMode) {
            return this.questionList.filter(q => this.wrongAnswers.has(q.id));
        }
        return this.questionList;
    }
    
    /**
     * 現在の問題を取得
     */
    getCurrentQuestion() {
        const questions = this.getDisplayQuestions();
        if (this.currentQuestionIndex >= questions.length) return null;
        return questions[this.currentQuestionIndex];
    }
    
    /**
     * 回答を記録
     */
    submitAnswer(selectedChoices) {
        const question = this.getCurrentQuestion();
        if (!question) return false;
        
        this.userAnswers.set(question.id, selectedChoices);
        
        // 正答チェック
        const isCorrect = this.checkAnswer(question.id, selectedChoices);
        if (!isCorrect) {
            this.wrongAnswers.add(question.id);
        } else {
            // 正解した場合は間違いリストから削除
            this.wrongAnswers.delete(question.id);
        }
        
        return true;
    }
    
    /**
     * ユーザーの回答を直接設定（デバッグ用）
     */
    setUserAnswer(questionId, selectedChoices) {
        this.userAnswers.set(questionId, selectedChoices);
        
        // 正答チェック
        const isCorrect = this.checkAnswer(questionId, selectedChoices);
        if (!isCorrect) {
            this.wrongAnswers.add(questionId);
        } else {
            // 正解した場合は間違いリストから削除
            this.wrongAnswers.delete(questionId);
        }
    }

    /**
     * 次の問題に進む
     */
    nextQuestion() {
        const questions = this.getDisplayQuestions();
        if (this.currentQuestionIndex < questions.length - 1) {
            this.currentQuestionIndex++;
            return true;
        }
        return false;
    }
    
    /**
     * 前の問題に戻る
     */
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            return true;
        }
        return false;
    }
    
    /**
     * 試験終了と採点
     */
    finishExam() {
        console.log('📝 ExamManager.finishExam called');
        console.log('User answers count:', this.userAnswers.size);
        
        this.endTime = new Date();
        this.calculateScores();
        
        // 間違い問題をapp.jsのwrongAnswersDBに保存
        this.saveWrongAnswersToApp();
        
        const results = this.generateDetailedResults();
        
        console.log('Generated results:', results);
        return results;
    }
    
    /**
     * 間違い問題をapp.jsに保存
     */
    saveWrongAnswersToApp() {
        if (typeof window !== 'undefined' && window.app) {
            console.log('💾 Saving wrong answers to app.wrongAnswersDB');
            console.log('Wrong answers to save:', Array.from(this.wrongAnswers));
            
            // 現在の年度の間違い問題を保存
            if (!window.app.wrongAnswersDB[window.app.selectedYear]) {
                window.app.wrongAnswersDB[window.app.selectedYear] = new Set();
            }
            
            // 間違い問題をマージ
            this.wrongAnswers.forEach(questionId => {
                window.app.wrongAnswersDB[window.app.selectedYear].add(questionId);
            });
            
            // ローカルストレージに保存
            window.app.saveWrongAnswersToStorage();
            
            console.log('✅ Wrong answers saved to app');
        }
    }
    
    /**
     * スコア計算
     */
    calculateScores() {
        // 分野別スコア初期化
        this.resetSectionScores();
        
        // 各問題の採点
        this.questionList.forEach(question => {
            const userAnswer = this.userAnswers.get(question.id);
            if (!userAnswer) return;
            
            const sectionScore = this.sectionScores.get(question.section);
            if (!sectionScore) return;
            
            if (this.checkAnswer(question.id, userAnswer)) {
                sectionScore.correctAnswers++;
            }
        });
        
        // 分野別合否判定
        for (const [sectionName, score] of this.sectionScores) {
            score.score = score.correctAnswers;
            if (score.passingScore !== null) {
                score.passed = score.score >= score.passingScore;
            }
        }
    }
    
    /**
     * 分野別スコアリセット
     */
    resetSectionScores() {
        for (const score of this.sectionScores.values()) {
            score.correctAnswers = 0;
            score.score = 0;
            score.passed = false;
        }
    }
    
    /**
     * 総合合否判定
     */
    getOverallJudgment() {
        const results = [];
        let allPassed = true;
        
        // 各分野の判定を行う
        for (const [sectionName, score] of this.sectionScores) {
            const passed = score.passed;
            results.push({
                section: sectionName,
                score: score.score,
                required: score.passingScore,
                total: score.totalQuestions,
                passed: passed
            });
            if (!passed) allPassed = false;
        }
        
        let message;
        if (allPassed) {
            message = '🎉 合格です！\n各分野で70%以上の正答率を達成しました。';
        } else {
            const failedSections = results.filter(r => !r.passed).map(r => r.section);
            message = `❌ 不合格です\n${failedSections.join('、')}で70%以上の正答率が必要です。`;
        }
        
        return {
            passed: allPassed,
            results: results,
            message: message
        };
    }
    
    /**
     * 詳細結果生成
     */
    generateDetailedResults() {
        const judgment = this.getOverallJudgment();
        const timeTaken = this.endTime - this.startTime;
        
        return {
            examInfo: {
                title: this.examData.exam_info?.name || 'タイトル不明',
                year: this.examData.exam_info?.year || '年度不明',
                examNumber: this.examData.exam_info?.exam_number || '回数不明'
            },
            judgment: judgment,
            sectionResults: Array.from(this.sectionScores.entries()).map(([name, score]) => ({
                section: name,
                score: score.score,
                total: score.totalQuestions,
                passingScore: score.passingScore,
                passed: score.passed,
                percentage: Math.round((score.score / score.totalQuestions) * 100)
            })),
            statistics: {
                totalQuestions: this.questionList.length,
                answeredQuestions: this.userAnswers.size,
                wrongAnswers: this.wrongAnswers.size,
                timeTaken: Math.round(timeTaken / 1000 / 60), // 分
                completionRate: Math.round((this.userAnswers.size / this.questionList.length) * 100)
            },
            wrongQuestionIds: Array.from(this.wrongAnswers)
        };
    }
    
    /**
     * 正答チェック
     */
    checkAnswer(questionId, userAnswer) {
        const question = this.questionList.find(q => q.id === questionId);
        if (!question || !question.correctAnswers) return false;
        
        // 配列として比較（順序は無視）
        const correctSet = new Set(question.correctAnswers);
        const userSet = new Set(userAnswer);
        
        if (correctSet.size !== userSet.size) return false;
        
        for (const answer of correctSet) {
            if (!userSet.has(answer)) return false;
        }
        
        return true;
    }
    
    /**
     * 問題表示用HTML生成
     */
    renderQuestion() {
        const question = this.getCurrentQuestion();
        if (!question) return '<p>問題がありません</p>';
        
        const questions = this.getDisplayQuestions();
        const currentIndex = this.currentQuestionIndex + 1;
        const totalQuestions = questions.length;
        
        const userAnswer = this.userAnswers.get(question.id) || [];
        const showAnswer = this.reviewMode;
        const isCorrect = showAnswer ? this.checkAnswer(question.id, userAnswer) : null;
        
        let html = `
            <div class="question-container">
                <div class="question-content">
                    <h3>問題${question.id}</h3>
                    <p class="question-text">${question.questionText}</p>
                    
                    ${question.selectCount > 1 ? 
                        `<p class="select-instruction">※ ${question.selectCount}つ選びなさい</p>` : ''}
                </div>
                
                <div class="choices-container">
        `;
        
        question.choices.forEach((choice, index) => {
            const choiceNumber = index + 1;
            const isSelected = userAnswer.includes(choiceNumber);
            const isCorrect = question.correctAnswers && question.correctAnswers.includes(choiceNumber);
            
            let choiceClass = 'choice';
            if (showAnswer) {
                if (isCorrect) choiceClass += ' correct';
                if (isSelected && !isCorrect) choiceClass += ' incorrect';
                if (isSelected && isCorrect) choiceClass += ' user-correct';
            } else if (isSelected) {
                choiceClass += ' selected';
            }
            
            html += `
                <div class="${choiceClass}" onclick="toggleChoice(${choiceNumber})">
                    <span class="choice-number">${choiceNumber}</span>
                    <span class="choice-text">${choice}</span>
                    ${showAnswer && isCorrect ? ' ✓' : ''}
                    ${showAnswer && isSelected && !isCorrect ? ' ✗' : ''}
                </div>
            `;
        });
        
        html += '</div>';
        
        if (showAnswer) {
            html += `
                <div class="answer-feedback ${isCorrect ? 'correct' : 'incorrect'}">
                    <h4>${isCorrect ? '✅ 正解' : '❌ 不正解'}</h4>
                    <p><strong>正答:</strong> ${question.correctAnswers ? question.correctAnswers.join(', ') : '不明'}</p>
                    ${question.explanation ? `<p><strong>解説:</strong> ${question.explanation}</p>` : ''}
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }
    
    /**
     * 結果表示用HTML生成
     */
    renderResults(results) {
        const judgment = results.judgment;
        
        let html = `
            <div class="results-container">
                <div class="results-header">
                    <h2>${results.examInfo.title}</h2>
                    <p>${results.examInfo.year} ${results.examInfo.examNumber}</p>
                </div>
                
                <div class="overall-judgment ${judgment.passed === null ? 'no-criteria' : (judgment.passed ? 'passed' : 'failed')}">
                    <h3>${judgment.message}</h3>
                </div>
                
                <div class="section-results">
                    <h4>📊 分野別結果</h4>
                    <p style="margin-bottom: 15px; color: #495057;">
                        ケアマネ試験の合格基準：各分野で正答率70%以上が必要です
                    </p>
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>分野</th>
                                <th>得点</th>
                                <th>合格点</th>
                                <th>正答率</th>
                                <th>判定</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        // 分野別結果を表示
        results.sectionResults.forEach(section => {
            const passedClass = section.passed ? 'section-passed' : 'section-failed';
            html += `
                <tr class="${passedClass}">
                    <td>${section.section}</td>
                    <td>${section.score}/${section.total}</td>
                    <td>${section.passingScore}</td>
                    <td>${section.percentage}%</td>
                    <td>${section.passed ? '✅ 合格' : '❌ 不合格'}</td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
                
                <div class="statistics">
                    <h4>📈 統計情報</h4>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">解答済み問題</span>
                            <span class="stat-value">${results.statistics.answeredQuestions}/${results.statistics.totalQuestions}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">間違えた問題</span>
                            <span class="stat-value">${results.statistics.wrongAnswers}問</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">所要時間</span>
                            <span class="stat-value">${results.statistics.timeTaken}分</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">完答率</span>
                            <span class="stat-value">${results.statistics.completionRate}%</span>
                        </div>
                    </div>
                </div>
        `;
        
        if (results.statistics.wrongAnswers > 0) {
            html += `
                <div class="wrong-questions-section">
                    <h4>❌ 間違えた問題</h4>
                    <p>問題ID: ${results.wrongQuestionIds.join(', ')}</p>
                    <button onclick="app.startWrongQuestionReview()" class="review-button">
                        間違い問題を復習する
                    </button>
                </div>
            `;
        }
        
        html += `
            </div>
        `;
        
        return html;
        return html;
    }
    
    /**
     * 間違い問題の統計
     */
    getWrongQuestionStats() {
        if (this.wrongAnswers.size === 0) return null;
        
        const wrongBySections = new Map();
        
        this.questionList.forEach(question => {
            if (this.wrongAnswers.has(question.id)) {
                if (!wrongBySections.has(question.section)) {
                    wrongBySections.set(question.section, []);
                }
                wrongBySections.get(question.section).push(question.id);
            }
        });
        
        return {
            total: this.wrongAnswers.size,
            bySections: Object.fromEntries(wrongBySections),
            questionIds: Array.from(this.wrongAnswers)
        };
    }
    
    /**
     * 問題の正解選択肢数を動的に計算
     */
    getSelectCount(questionId) {
        // answersデータがある場合は、正解の選択肢数を使用
        if (this.examData.answers) {
            let correctAnswers = null;
            
            // 介護支援分野（問題1-25）
            if (questionId <= 25 && this.examData.answers.care_support_field) {
                correctAnswers = this.examData.answers.care_support_field[questionId.toString()];
            }
            // 保健医療福祉サービス分野（問題26-60）
            else if (questionId >= 26 && this.examData.answers.health_welfare_service_field) {
                correctAnswers = this.examData.answers.health_welfare_service_field[questionId.toString()];
            }
            
            if (correctAnswers && Array.isArray(correctAnswers)) {
                return correctAnswers.length;
            }
        }
        
        // answersデータがない場合のデフォルト値も動的に計算
        // デフォルト値は3（最も一般的な選択数）
        return 3;
    }
}

// グローバル変数として設定（ブラウザ環境用）
if (typeof window !== 'undefined') {
    window.ExamManagerWithJudgment = ExamManagerWithJudgment;
}

// Node.js環境用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExamManagerWithJudgment;
}
