const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始初始化数据...');

  // 1. 初始化资产类型
  const assetTypes = [
    { name: '现金', code: 'CASH', direction: 'ASSET', riskLevel: 'LOW', includeInTotal: true, includeInChart: true, sort: 1, remark: '微信、支付宝、银行卡活期等' },
    { name: '稳健理财', code: 'STABLE_INVEST', direction: 'ASSET', riskLevel: 'LOW', includeInTotal: true, includeInChart: true, sort: 2, remark: '银行理财、货币基金、债券基金等' },
    { name: '激进理财', code: 'AGGRESSIVE_INVEST', direction: 'ASSET', riskLevel: 'HIGH', includeInTotal: true, includeInChart: true, sort: 3, remark: '股票、基金、ETF等' },
    { name: '固定资产', code: 'FIXED_ASSET', direction: 'ASSET', riskLevel: 'NONE', includeInTotal: true, includeInChart: false, sort: 4, remark: '房产、车辆等，可选择不放入图表' },
    { name: '负债', code: 'DEBT', direction: 'DEBT', riskLevel: 'NONE', includeInTotal: true, includeInChart: false, sort: 5, remark: '房贷、信用卡、借款等' },
    { name: '其他', code: 'OTHER', direction: 'ASSET', riskLevel: 'NONE', includeInTotal: true, includeInChart: true, sort: 99, remark: '其他资产' },
  ];

  for (const at of assetTypes) {
    await prisma.financeAssetType.upsert({
      where: { code: at.code },
      update: at,
      create: at,
    });
  }
  console.log('✅ 资产类型初始化完成');

  // 2. 初始化所有人
  const owners = [
    { name: '我', sort: 1, remark: '默认所有人' },
    { name: '家庭公共', sort: 99, remark: '家庭公共资产/负债' },
  ];

  for (const owner of owners) {
    const existing = await prisma.financeOwner.findFirst({ where: { name: owner.name } });
    if (!existing) {
      await prisma.financeOwner.create({ data: owner });
    }
  }
  console.log('✅ 所有人初始化完成');

  // 3. 初始化示例年度目标
  const currentYear = new Date().getFullYear();
  const existingGoal = await prisma.financeYearGoal.findUnique({ where: { year: currentYear } });
  if (!existingGoal) {
    await prisma.financeYearGoal.create({
      data: {
        year: currentYear,
        targetAmount: 100000,
        startAmount: 0,
        remark: `${currentYear}年存款目标`,
      },
    });
    console.log(`✅ ${currentYear}年度目标初始化完成`);
  } else {
    console.log(`ℹ️ ${currentYear}年度目标已存在，跳过`);
  }

  console.log('🎉 数据初始化完成！');
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
