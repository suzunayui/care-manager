/**
 * データローダーモジュール
 * 試験データ（問題と解答）の読み込みを担当
 */
class DataLoader {
    constructor() {
        this.yearInfoMap = {
            'r2': { name: '令和2年', year: 'r2', examNumber: 23, hasPassingCriteria: true },
            'r3': { name: '令和3年', year: 'r3', examNumber: 24, hasPassingCriteria: true },
            'r4': { name: '令和4年', year: 'r4', examNumber: 25, hasPassingCriteria: true },
            'r5': { name: '令和5年', year: 'r5', examNumber: 26, hasPassingCriteria: true },
            'r6': { name: '令和6年', year: 'r6', examNumber: 27, hasPassingCriteria: true }
        };
    }

    /**
     * 全年度のデータを読み込み
     */
    async loadAllYearsData() {
        const years = ['r6', 'r5', 'r4', 'r3', 'r2']; // 新しい順に変更
        const data = {};
        const yearsList = [];
        
        for (const year of years) {
            try {
                console.log(`Loading data for ${year}...`);
                
                // 問題データを読み込み
                const questionsResponse = await fetch(`${year}_questions.json`);
                if (questionsResponse.ok) {
                    const questionsData = await questionsResponse.json();
                    
                    // 正答データも読み込み
                    const answersResponse = await fetch(`${year}_answers.json`);
                    if (answersResponse.ok) {
                        const answersData = await answersResponse.json();
                        
                        // 正答データを問題データにマージ
                        const mergedData = {
                            ...questionsData,
                            answers: answersData.answers,
                            passing_criteria: answersData.passing_criteria
                        };
                        
                        data[year] = mergedData;
                        yearsList.push(this.yearInfoMap[year]);
                        console.log(`✅ ${year} data and answers loaded successfully`);
                    } else {
                        console.warn(`⚠️ ${year} answers not found, using questions only`);
                        data[year] = questionsData;
                        yearsList.push(this.yearInfoMap[year]);
                    }
                } else {
                    console.warn(`⚠️ ${year} data not found (${questionsResponse.status})`);
                }
            } catch (error) {
                console.warn(`❌ ${year}のデータ読み込みに失敗:`, error);
            }
        }
        
        if (yearsList.length === 0) {
            throw new Error('試験データが一つも読み込めませんでした。JSONファイルが正しく配置されているか確認してください。');
        }
        
        console.log(`📊 Total loaded years: ${yearsList.length}`);
        return { years: yearsList, data: data };
    }

    /**
     * 特定年度のデータを読み込み
     */
    async loadYearData(year) {
        try {
            console.log(`Loading data for ${year}...`);
            
            const questionsResponse = await fetch(`${year}_questions.json`);
            if (!questionsResponse.ok) {
                throw new Error(`Questions data not found for ${year}`);
            }
            
            const questionsData = await questionsResponse.json();
            
            try {
                const answersResponse = await fetch(`${year}_answers.json`);
                if (answersResponse.ok) {
                    const answersData = await answersResponse.json();
                    
                    return {
                        ...questionsData,
                        answers: answersData.answers,
                        passing_criteria: answersData.passing_criteria
                    };
                }
            } catch (error) {
                console.warn(`Answers not found for ${year}, using questions only`);
            }
            
            return questionsData;
        } catch (error) {
            console.error(`Failed to load data for ${year}:`, error);
            throw error;
        }
    }

    /**
     * 問題の正解選択肢数を動的に計算
     */
    getSelectCount(year, questionId, questionsData, answersData) {
        // answersデータがある場合は、正解の選択肢数を使用
        if (answersData && answersData.answers) {
            let correctAnswers = null;
            
            // 介護支援分野（問題1-25）
            if (questionId <= 25 && answersData.answers.care_support_field) {
                correctAnswers = answersData.answers.care_support_field[questionId.toString()];
            }
            // 保健医療福祉サービス分野（問題26-60）
            else if (questionId >= 26 && answersData.answers.health_welfare_service_field) {
                correctAnswers = answersData.answers.health_welfare_service_field[questionId.toString()];
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
