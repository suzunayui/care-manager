/**
 * アプリケーション初期化とグローバル関数定義
 */

// グローバル関数を最初に定義（より堅牢なエラーハンドリング付き）
window.toggleChoice = function(choiceNumber) {
    console.log('toggleChoice called with:', choiceNumber);
    
    // アプリとコントローラーの可用性をチェック
    if (window.app && window.app.choiceController) {
        console.log('Calling choiceController.toggleChoice');
        window.app.choiceController.toggleChoice(choiceNumber);
        return;
    }
    
    // 初期化が完了していない場合の処理
    console.warn('ChoiceController not available, attempting to initialize...');
    
    // 強制的にコントローラーを初期化を試行
    if (window.app && window.ChoiceController && !window.app.choiceController) {
        try {
            console.log('Force initializing ChoiceController...');
            window.app.choiceController = new ChoiceController(window.app);
            window.app.choiceController.toggleChoice(choiceNumber);
            return;
        } catch (error) {
            console.error('Failed to force initialize ChoiceController:', error);
        }
    }
    
    // 最後の手段：少し待ってから再試行
    let retryCount = 0;
    const maxRetries = 5;
    const retryInterval = setInterval(() => {
        console.log(`Retry attempt ${retryCount + 1}/${maxRetries}`);
        
        if (window.app && window.app.choiceController) {
            console.log('ChoiceController now available, executing choice');
            clearInterval(retryInterval);
            window.app.choiceController.toggleChoice(choiceNumber);
        } else if (retryCount >= maxRetries - 1) {
            console.error('Failed to initialize ChoiceController after', maxRetries, 'attempts');
            clearInterval(retryInterval);
            notificationSystem.showError('システムの初期化に失敗しました。ページを再読み込みしてください。');
        }
        retryCount++;
    }, 200);
};

// アプリケーション初期化
let initializationComplete = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting initialization process...');
    
    // アプリが初期化されるまで待つ
    const waitForAppInit = () => {
        if (window.app && !initializationComplete) {
            console.log('App found, checking for required classes...');
            
            // 必要なクラスがすべて読み込まれているかチェック
            if (window.ExamController && window.ChoiceController && window.ExamManagerWithJudgment) {
                try {
                    console.log('All classes available, initializing controllers...');
                    
                    // コントローラーを初期化
                    app.examController = new ExamController(app);
                    app.choiceController = new ChoiceController(app);
                    
                    initializationComplete = true;
                    console.log('✅ Controllers initialized successfully');
                    console.log('App state:', {
                        app: !!window.app,
                        examController: !!window.app.examController,
                        choiceController: !!window.app.choiceController
                    });
                } catch (error) {
                    console.error('❌ Error initializing controllers:', error);
                }
            } else {
                console.log('Waiting for classes to load...', {
                    ExamController: !!window.ExamController,
                    ChoiceController: !!window.ChoiceController,
                    ExamManagerWithJudgment: !!window.ExamManagerWithJudgment
                });
                setTimeout(waitForAppInit, 100);
            }
        } else if (!window.app) {
            console.log('Waiting for app to initialize...');
            setTimeout(waitForAppInit, 100);
        }
    };
    
    // 初期化開始
    setTimeout(waitForAppInit, 100);
});

// デバッグ用のグローバル関数を追加
window.debugAppState = function() {
    console.log('=== App Debug State ===');
    console.log('window.app:', !!window.app);
    if (window.app) {
        console.log('app.examController:', !!window.app.examController);
        console.log('app.choiceController:', !!window.app.choiceController);
        console.log('app.currentMode:', window.app.currentMode);
        console.log('app.currentExamManager:', !!window.app.currentExamManager);
    }
    console.log('window.ExamController:', !!window.ExamController);
    console.log('window.ChoiceController:', !!window.ChoiceController);
    console.log('window.ExamManagerWithJudgment:', !!window.ExamManagerWithJudgment);
    console.log('window.toggleChoice:', typeof window.toggleChoice);
    console.log('======================');
};
