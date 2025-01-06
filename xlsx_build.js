const fs = require("fs");
const XLSX = require("xlsx-js-style");
const readline = require('readline');
 function getData(isNewMarket) {
  try {
    const filePath=isNewMarket === 'y'?"./data_new.json":"./data.json"
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
}

// 添加用户输入函数
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.toLowerCase());
    })
  );
}

function generateXlsx(rows,isNewMarket) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  // 设置单元格的样式：水平和垂直居中，以及边框
  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cell_address]) continue;

      // 设置单元格的样式：水平和垂直居中，以及边框
      worksheet[cell_address].s = {
        alignment: {
          horizontal: "center", // 水平居中
          vertical: "center", // 垂直居中
          wrapText: true, // 自动换行
        },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" }, // 这里确保左边框存在
          right: { style: "thin" },
        },
      };

      // 设置表头字体加粗并变红
      if (R === 0) {
        worksheet[cell_address].s.font = {
          bold: true,
          color: { rgb: "FF0000" },
        };
      }
    }
  }

  worksheet["!cols"] = [
    { wpx: 200 },
    {},
    { wpx: 200 },
    { wpx: 200 },
    { wpx: 200 },
    { wpx: 100 },
    {},
    { wpx: 100 },
  ];
  const fileName=isNewMarket === 'y'?"新兴小类目统计":"大类目统计"
  XLSX.utils.book_append_sheet(workbook, worksheet, fileName);
  XLSX.writeFile(workbook,  `${fileName}.xlsx`);
}
async function main() {
  const isNewMarket = await askQuestion("是否获取新市场？(y/n): ");
  const data = [...getData(isNewMarket)];
  const thead = [
    "类目名称",
    "总销量/万",
    "类目内店铺的总数/万",
    "前 100 卖家平均客单价/$",
    "前 100 卖家平均销量/万",
    "商品总数/万",
    "评论总数",
    "市场可做性 F",
  ];
  const rows = [thead];

  const result = data
    .map((item) => {
      const {
        category_name,
        product_total,
        store_total,
        top100_price_avg,
        top100_order_avg,
        order_total,
        review_total,
      } = item;
      const feasibility =
        (top100_price_avg * (order_total / 10000)) /
        ((review_total / 100000) * (product_total / 10000)) /
        1000;
      const data = [
        category_name,
        order_total / 10000,
        store_total / 10000,
        top100_price_avg,
        top100_order_avg / 10000,
        product_total / 10000,
        review_total / 10000,
        feasibility,
      ];
      return data;
    })
    .sort((a, b) => {
      return b[7] - a[7];
    });

  //  生成 xlsx
  rows.push(...result);
  generateXlsx(rows,isNewMarket);
}

main();
