/**
 * UIレンダリングモジュール
 * 年度選択画面とモード選択画面のレンダリングを担当
 */
class UIRenderer {
    constructor() {}

    /**
     * 年度選択画面をレンダリング
     */
    renderYearSelection(yearsData, app) {
        const yearSelection = document.getElementById('year-selection');
        
        yearSelection.innerHTML = `
            <div class="year-selection-container">
                <h2>📚 試験年度を選択してください</h2>
                <div class="year-grid" id="year-grid"></div>
                
                <div class="reset-section">
                    <button id="reset-learning-data" class="reset-btn" onclick="app.resetLearningData()">
                        🗑️ 学習状況をリセットする
                    </button>
                    <p class="reset-description">全ての学習データ（正解・間違い記録）を削除します</p>
                </div>
            </div>
        `;

        const yearGrid = document.getElementById('year-grid');
        
        yearsData.years.forEach(yearInfo => {
            const yearCard = document.createElement('div');
            yearCard.className = 'year-card';
            yearCard.onclick = () => app.selectYear(yearInfo.year);
            
            // 合格基準情報を取得
            const yearData = yearsData.data[yearInfo.year];
            const passingCriteria = yearData?.exam_info?.passing_criteria;
            
            yearCard.innerHTML = `
                <div class="year-info">
                    <h3>${yearInfo.name}</h3>
                    <p class="exam-number">第${yearInfo.examNumber}回</p>
                    ${passingCriteria ? `
                        <div class="passing-criteria">
                            <h4>🎯 合格基準</h4>
                            <div class="criteria-section">
                                <div class="criteria-item">
                                    <span class="criteria-label">介護支援:</span>
                                    <span class="criteria-value">${passingCriteria.care_support_field.passing_score}/${passingCriteria.care_support_field.total_questions}問 (${passingCriteria.care_support_field.passing_percentage})</span>
                                </div>
                                <div class="criteria-item">
                                    <span class="criteria-label">保健医療福祉:</span>
                                    <span class="criteria-value">${passingCriteria.health_welfare_service_field.passing_score}/${passingCriteria.health_welfare_service_field.total_questions}問 (${passingCriteria.health_welfare_service_field.passing_percentage})</span>
                                </div>
                                <div class="criteria-total">
                                    <strong>全体: ${passingCriteria.overall.min_passing_score}/${passingCriteria.overall.total_questions}問以上</strong>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="passing-criteria">
                            <p class="no-criteria">合格基準情報なし</p>
                        </div>
                    `}
                </div>
            `;
            
            yearGrid.appendChild(yearCard);
        });
    }

    /**
     * モード選択画面をレンダリング
     */
    renderModeSelection(yearData, app) {
        const modeSelection = document.getElementById('mode-selection');
        
        // 間違い問題数を取得
        const wrongCount = app.getWrongQuestionCount();
        
        modeSelection.innerHTML = `
            <div class="mode-selection-container">
                <div class="selected-year-info">
                    <h2>📖 ${yearData.displayYear || '試験年度'}</h2>
                    <p>学習モードを選択してください</p>
                </div>
                
                <div class="mode-buttons">
                    <button class="mode-btn" onclick="app.startFullExam()">
                        📝 完全試験モード<br>
                        <small>全60問を通して解答</small>
                    </button>
                    <button class="mode-btn primary" onclick="app.startSequentialStudy()">
                        📚 順次学習モード<br>
                        <small>1問目から順番に正答を見ながら学習</small>
                    </button>
                    <button class="mode-btn secondary" onclick="app.startRandomQuestion()">
                        🎲 ランダム1問チャレンジ<br>
                        <small>ランダムに1問ずつ学習</small>
                    </button>
                    <button class="mode-btn danger" onclick="app.startWrongQuestionReview()" ${wrongCount === 0 ? 'disabled' : ''}>
                        ❌ 間違い問題復習<br>
                        <small>${wrongCount}問の復習が可能</small>
                    </button>
                </div>
                
                <div class="additional-options">
                    <button class="stats-btn" onclick="app.showStatistics()">
                        📊 学習統計を見る
                    </button>
                    <button class="back-btn" onclick="app.showYearSelection()">
                        ← 年度選択に戻る
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * ローディング画面を表示
     */
    showLoading() {
        const loading = document.getElementById('loading');
        loading.style.display = 'flex';
        
        // 他の画面を非表示
        this.hideAllScreens();
    }

    /**
     * ローディング画面を非表示
     */
    hideLoading() {
        const loading = document.getElementById('loading');
        loading.style.display = 'none';
    }

    /**
     * 全ての画面を非表示
     */
    hideAllScreens() {
        const screens = [
            'year-selection',
            'mode-selection', 
            'question-interface',
            'results-display',
            'statistics-display'
        ];
        
        screens.forEach(screenId => {
            const screen = document.getElementById(screenId);
            if (screen) {
                screen.style.display = 'none';
                
                // 結果画面と統計画面の場合は内容もクリア
                if (screenId === 'results-display' || screenId === 'statistics-display') {
                    screen.innerHTML = '';
                }
            }
        });
    }

    /**
     * 指定された画面を表示
     */
    showScreen(screenId) {
        this.hideAllScreens();
        this.hideLoading();
        
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.style.display = 'block';
        }
    }
}
