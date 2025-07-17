/**
 * 選択肢操作モジュール
 */
class ChoiceController {
    constructor(app) {
        this.app = app;
    }
    
    /**
     * 選択肢トグル（メイン関数）
     */
    toggleChoice(choiceNumber) {
        console.log('ChoiceController.toggleChoice called with:', choiceNumber);
        console.log('Current mode:', this.app.currentMode);
        console.log('Showing answer:', this.app.showingAnswer);
        
        if (this.app.showingAnswer) {
            console.log('Answer is showing, ignoring click');
            return; // 正答表示中は操作不可
        }
        
        if (this.app.currentMode === 'full') {
            console.log('Calling toggleChoiceFullMode');
            this.toggleChoiceFullMode(choiceNumber);
        } else if (this.app.currentMode === 'random' || this.app.currentMode === 'review') {
            console.log('Calling toggleChoiceRandomMode');
            this.toggleChoiceRandomMode(choiceNumber);
        } else if (this.app.currentMode === 'sequential') {
            console.log('Calling toggleChoiceSequentialMode');
            this.toggleChoiceSequentialMode(choiceNumber);
        } else {
            console.log('Unknown mode:', this.app.currentMode);
        }
    }
    
    /**
     * 完全試験モードの選択肢トグル
     */
    toggleChoiceFullMode(choiceNumber) {
        console.log('toggleChoiceFullMode called with:', choiceNumber);
        const question = this.app.currentExamManager.getCurrentQuestion();
        if (!question) {
            console.log('No current question found');
            return;
        }
        
        console.log('Current question:', question.id);
        let userAnswer = this.app.currentExamManager.userAnswers.get(question.id) || [];
        console.log('Current user answer:', userAnswer);
        
        if (userAnswer.includes(choiceNumber)) {
            // 選択解除
            userAnswer = userAnswer.filter(choice => choice !== choiceNumber);
            console.log('Deselecting choice', choiceNumber);
        } else {
            // 選択
            if (question.selectCount === 1) {
                // 単一選択の場合、他の選択肢をクリア
                userAnswer = [choiceNumber];
                console.log('Single select, setting to:', userAnswer);
            } else {
                // 複数選択の場合
                if (userAnswer.length < question.selectCount) {
                    userAnswer.push(choiceNumber);
                    console.log('Multi select, adding choice:', userAnswer);
                } else {
                    // 選択数上限に達している場合は最初の選択肢を削除
                    userAnswer.shift();
                    userAnswer.push(choiceNumber);
                    console.log('Multi select, replacing oldest:', userAnswer);
                }
            }
        }
        
        // 回答を記録
        this.app.currentExamManager.submitAnswer(userAnswer);
        console.log('Answer submitted:', userAnswer);
        
        // 表示を更新
        this.updateChoiceDisplay(question, userAnswer);
    }
    
    /**
     * ランダムモードの選択肢トグル
     */
    toggleChoiceRandomMode(choiceNumber) {
        const question = this.app.randomQuestionPool[this.app.currentRandomIndex];
        if (!question) return;
        
        console.log(`🔍 Question ${question.id}: selectCount = ${question.selectCount}`);
        
        let userAnswer = this.app.tempUserAnswer || [];
        console.log('Current userAnswer:', userAnswer);

        if (userAnswer.includes(choiceNumber)) {
            // 選択解除
            userAnswer = userAnswer.filter(choice => choice !== choiceNumber);
        } else {
            // 選択
            if (question.selectCount === 1) {
                // 単一選択の場合、他の選択肢をクリア
                userAnswer = [choiceNumber];
            } else {
                // 複数選択の場合
                if (userAnswer.length < question.selectCount) {
                    userAnswer.push(choiceNumber);
                } else {
                    // 選択数上限に達している場合は最初の選択肢を削除
                    userAnswer.shift();
                    userAnswer.push(choiceNumber);
                }
            }
        }
        
        // 一時的な回答を保存
        this.app.tempUserAnswer = userAnswer;
        
        // 表示を更新
        this.updateChoiceDisplay(question, userAnswer);
    }
    
    /**
     * 順次学習モードの選択肢トグル
     */
    toggleChoiceSequentialMode(choiceNumber) {
        console.log('toggleChoiceSequentialMode called with:', choiceNumber);
        const question = this.app.randomQuestionPool[this.app.currentRandomIndex];
        console.log(`🔍 Question ${question.id}: selectCount = ${question.selectCount}`);
        
        let userAnswer = [...this.app.tempUserAnswer] || [];
        
        if (userAnswer.includes(choiceNumber)) {
            console.log('Deselecting choice', choiceNumber);
            // 選択を解除
            userAnswer = userAnswer.filter(choice => choice !== choiceNumber);
        } else {
            if (question.selectCount === 1) {
                // 単一選択の場合は他の選択肢をクリア
                userAnswer = [choiceNumber];
            } else {
                // 複数選択の場合
                if (userAnswer.length < question.selectCount) {
                    userAnswer.push(choiceNumber);
                } else {
                    // 選択数上限に達している場合は最初の選択肢を削除
                    userAnswer.shift();
                    userAnswer.push(choiceNumber);
                }
            }
        }
        
        // 一時的な回答を保存
        this.app.tempUserAnswer = userAnswer;
        
        // 表示を更新
        this.updateChoiceDisplay(question, userAnswer);
    }
    
    /**
     * 選択肢表示を更新
     */
    updateChoiceDisplay(question, userAnswer) {
        const choices = document.querySelectorAll('.choice');
        
        choices.forEach((choiceElement, index) => {
            const choiceNumber = index + 1;
            const isSelected = userAnswer.includes(choiceNumber);
            const numberElement = choiceElement.querySelector('.choice-number');
            
            // クラスをリセット
            choiceElement.className = 'choice';
            
            if (isSelected) {
                choiceElement.classList.add('selected');
                if (numberElement) {
                    numberElement.style.background = '#007bff';
                }
            } else {
                if (numberElement) {
                    numberElement.style.background = '#6c757d';
                }
            }
        });
        
        // 選択数の警告表示（無効化）
        // this.updateSelectionWarning(question, userAnswer);
    }
    
    /**
     * 選択数警告の更新（無効化）
     */
    /*
    updateSelectionWarning(question, userAnswer) {
        // 既存の警告を削除
        const existingWarning = document.querySelector('.selection-warning');
        if (existingWarning) {
            existingWarning.remove();
        }
        
        // 選択数チェック
        if (userAnswer.length > question.selectCount) {
            const warningElement = document.createElement('div');
            warningElement.className = 'selection-warning';
            warningElement.style.cssText = `
                background: #fff3cd;
                color: #856404;
                padding: 10px 15px;
                border-radius: 8px;
                margin: 15px 0;
                border-left: 4px solid #ffc107;
            `;
            warningElement.innerHTML = `
                ⚠️ 選択数が上限（${question.selectCount}つ）を超えています。
                最新の選択肢が優先され、古い選択肢は自動的に解除されます。
            `;
            
            const choicesContainer = document.querySelector('.choices-container');
            if (choicesContainer) {
                choicesContainer.appendChild(warningElement);
            }
        } else if (userAnswer.length === 0) {
            const warningElement = document.createElement('div');
            warningElement.className = 'selection-warning';
            warningElement.style.cssText = `
                background: #f8d7da;
                color: #721c24;
                padding: 10px 15px;
                border-radius: 8px;
                margin: 15px 0;
                border-left: 4px solid #dc3545;
            `;
            warningElement.innerHTML = `
                📝 ${question.selectCount}つの選択肢を選んでください。
            `;
            
            const choicesContainer = document.querySelector('.choices-container');
            if (choicesContainer) {
                choicesContainer.appendChild(warningElement);
            }
        }
    }
    */
    
    /**
     * 選択肢の状態をクリア
     */
    clearAllChoices() {
        if (this.app.currentMode === 'full') {
            const question = this.app.currentExamManager.getCurrentQuestion();
            if (question) {
                this.app.currentExamManager.userAnswers.set(question.id, []);
                this.updateChoiceDisplay(question, []);
            }
        } else {
            this.app.tempUserAnswer = [];
            const question = this.app.randomQuestionPool[this.app.currentRandomIndex];
            if (question) {
                this.updateChoiceDisplay(question, []);
            }
        }
    }
    
    /**
     * 現在の選択状態を取得
     */
    getCurrentSelection() {
        if (this.app.currentMode === 'full') {
            const question = this.app.currentExamManager.getCurrentQuestion();
            return question ? this.app.currentExamManager.userAnswers.get(question.id) || [] : [];
        } else {
            return this.app.tempUserAnswer || [];
        }
    }
    
    /**
     * 選択完了チェック
     */
    isSelectionComplete() {
        const selection = this.getCurrentSelection();
        
        if (this.app.currentMode === 'full') {
            const question = this.app.currentExamManager.getCurrentQuestion();
            return question ? selection.length === question.selectCount : false;
        } else {
            const question = this.app.randomQuestionPool[this.app.currentRandomIndex];
            return question ? selection.length === question.selectCount : false;
        }
    }
}

// ChoiceControllerをグローバルに設定
if (typeof window !== 'undefined') {
    window.ChoiceController = ChoiceController;
}
