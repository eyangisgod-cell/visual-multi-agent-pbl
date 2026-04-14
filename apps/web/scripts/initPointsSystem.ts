/**
 * 初始化积分系统脚本
 * 用于设置默认的积分规则和等级配置
 *
 * 使用方法：npx ts-node scripts/initPointsSystem.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化积分系统...');

  // 初始化默认积分规则
  const defaultRules = [
    { action: 'login', points: 1, description: '每日签到' },
    { action: 'daily_bonus', points: 5, description: '每日奖励' },
    { action: 'submit_work', points: 10, description: '提交作品' },
    { action: 'work_approved', points: 50, description: '作品通过审核' },
    { action: 'work_rejected', points: -5, description: '作品被拒绝' },
    { action: 'invite_user', points: 20, description: '邀请新用户' },
    { action: 'complete_task', points: 15, description: '完成任务' },
    { action: 'admin_bonus', points: 100, description: '管理员奖励' },
    { action: 'admin_deduction', points: -50, description: '管理员扣除' },
  ];

  console.log('\n正在创建积分规则...');
  for (const rule of defaultRules) {
    await prisma.pointsRule.upsert({
      where: { action: rule.action },
      update: {
        points: rule.points,
        description: rule.description,
        isActive: true
      },
      create: {
        action: rule.action,
        points: rule.points,
        description: rule.description,
        isActive: true,
      },
    });
    console.log(`  ✓ ${rule.action}: ${rule.points} 积分`);
  }

  // 初始化默认等级配置
  const defaultLevels = [
    { level: 1, name: '初学者', minPoints: 0, maxPoints: 99 },
    { level: 2, name: '新手', minPoints: 100, maxPoints: 299 },
    { level: 3, name: '进阶者', minPoints: 300, maxPoints: 599 },
    { level: 4, name: '高手', minPoints: 600, maxPoints: 999 },
    { level: 5, name: '专家', minPoints: 1000, maxPoints: 1999 },
    { level: 6, name: '大师', minPoints: 2000, maxPoints: 4999 },
    { level: 7, name: '宗师', minPoints: 5000, maxPoints: null },
  ];

  console.log('\n正在创建等级配置...');
  for (const level of defaultLevels) {
    await prisma.userLevel.upsert({
      where: { level: level.level },
      update: level,
      create: level,
    });
    console.log(`  ✓ Lv.${level.level}: ${level.name} (${level.minPoints}-${level.maxPoints || '∞'} 积分)`);
  }

  console.log('\n✅ 积分系统初始化完成!');
  console.log('\n积分规则概览:');
  console.log('  - 每日签到：+1 积分');
  console.log('  - 每日奖励：+5 积分');
  console.log('  - 提交作品：+10 积分');
  console.log('  - 作品通过审核：+50 积分');
  console.log('  - 邀请新用户：+20 积分');
  console.log('  - 完成任务：+15 积分');
  console.log('\n等级概览:');
  console.log('  - Lv.1 初学者：0-99 积分');
  console.log('  - Lv.2 新手：100-299 积分');
  console.log('  - Lv.3 进阶者：300-599 积分');
  console.log('  - Lv.4 高手：600-999 积分');
  console.log('  - Lv.5 专家：1000-1999 积分');
  console.log('  - Lv.6 大师：2000-4999 积分');
  console.log('  - Lv.7 宗师：5000+ 积分');
}

main()
  .catch((e) => {
    console.error('初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
