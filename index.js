const axios = require('axios');
const fs = require("fs");
const path = require("path");
// 添加 readline 模块
const readline = require('readline');
/**
 * @description 随机延迟函数
 * @param {number} min 最小延迟时间（秒）
 * @param {number} max 最大延迟时间（秒）
 */
function sleep(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min) * 1000;
    return new Promise(resolve => setTimeout(resolve, delay));
}

// 添加用户输入函数
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans.toLowerCase());
    }));
}


/**
 * @description 爬虫主体程序
 */
async function main() {
    // 添加用户交互
    const isNewMarket = await askQuestion('是否获取新市场？(y/n): ');
    const result = [];
    let currentPage = 1;
    
    try {
        while (true) {
            const headers = {
                // ... 原有的 headers 保持不变 ...
            };

            const params = {
                lang: 'cn',
                page: currentPage,
                category_name: '',
                sorted_by: '',
                product_total: '',
                store_total: '',
                review_total: isNewMarket === 'y' ? '0~100000' : '', // 根据用户选择设置 review_total
                order_total: '',
                top100_price_avg: '',
                top100_review_avg: '',
                top100_order_avg: '',
                review_week: '',
                order_week: '',
                top100_publish_avg: '~',
                page_num: currentPage
            };

            const response = await axios.get('https://thunt.ai/api/category_analysis/get_list', {
                headers,
                params,
            });

            const currentData = response.data.data.list || [];
            console.log(`第 ${currentPage} 页数据获取成功，共 ${currentData.length} 条`);

            if (currentData.length === 0) {
                console.log('没有更多数据了');
                break;
            }

            // 检查最后一条数据是否已存在
            const lastItem = currentData[currentData.length - 1];
            const isDuplicate = result.some(item => item.category_name === lastItem.category_name);

            // 将新数据添加到结果数组
            result.push(...currentData);

            if (isDuplicate) {
                console.log('发现重复数据，爬取完成');
                break;
            }

            // 页码加1
            currentPage++;

            // 随机延迟0-2秒
            await sleep(0, 2);
        }

        console.log('爬取完成，共获取数据：', result.length);
        const outputFile = isNewMarket === 'y' ? './data_new.json' : './data.json';
        fs.writeFileSync(outputFile,JSON.stringify(result, null, 2))
        
    } catch (error) {
        console.error('请求失败：', error.message);
    }
}

main();