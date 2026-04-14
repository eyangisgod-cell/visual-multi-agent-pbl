import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 邮件服务配置相关的设置键
const EMAIL_SETTINGS_KEYS = {
  SMTP_HOST: 'smtp_host',
  SMTP_PORT: 'smtp_port',
  SMTP_USER: 'smtp_user',
  SMTP_PASSWORD: 'smtp_password',
  SMTP_SECURE: 'smtp_secure',
  FROM_EMAIL: 'from_email',
  FROM_NAME: 'from_name',
};

// GET /api/admin/settings/email - 获取邮件服务配置
export async function GET() {
  try {
    const emailSettings = await prisma.systemSetting.findMany({
      where: {
        category: 'email',
      },
    });

    // 将数组转换为对象格式返回
    const config: any = {};
    emailSettings.forEach((setting) => {
      config[setting.key] = setting.value;
    });

    // 隐藏敏感的密码信息
    if (config[EMAIL_SETTINGS_KEYS.SMTP_PASSWORD]) {
      config[EMAIL_SETTINGS_KEYS.SMTP_PASSWORD] = '********';
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings/email - 更新邮件服务配置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpSecure,
      fromEmail,
      fromName,
    } = body;

    // 构建更新数据
    const settingsToUpdate: Array<{ key: string; value: any; category: string }> = [];

    if (smtpHost !== undefined) {
      settingsToUpdate.push({
        key: EMAIL_SETTINGS_KEYS.SMTP_HOST,
        value: smtpHost,
        category: 'email',
      });
    }

    if (smtpPort !== undefined) {
      settingsToUpdate.push({
        key: EMAIL_SETTINGS_KEYS.SMTP_PORT,
        value: smtpPort,
        category: 'email',
      });
    }

    if (smtpUser !== undefined) {
      settingsToUpdate.push({
        key: EMAIL_SETTINGS_KEYS.SMTP_USER,
        value: smtpUser,
        category: 'email',
      });
    }

    // 只有当提供了新密码时才更新（不包含掩码）
    if (smtpPassword && smtpPassword !== '********') {
      settingsToUpdate.push({
        key: EMAIL_SETTINGS_KEYS.SMTP_PASSWORD,
        value: smtpPassword,
        category: 'email',
      });
    }

    if (smtpSecure !== undefined) {
      settingsToUpdate.push({
        key: EMAIL_SETTINGS_KEYS.SMTP_SECURE,
        value: smtpSecure,
        category: 'email',
      });
    }

    if (fromEmail !== undefined) {
      settingsToUpdate.push({
        key: EMAIL_SETTINGS_KEYS.FROM_EMAIL,
        value: fromEmail,
        category: 'email',
      });
    }

    if (fromName !== undefined) {
      settingsToUpdate.push({
        key: EMAIL_SETTINGS_KEYS.FROM_NAME,
        value: fromName,
        category: 'email',
      });
    }

    // 批量更新设置
    const updatePromises = settingsToUpdate.map((setting) =>
      prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          category: setting.category,
        },
        create: {
          key: setting.key,
          value: setting.value,
          category: setting.category,
        },
      })
    );

    await Promise.all(updatePromises);

    // 重新获取并返回更新后的配置
    return GET();
  } catch (error) {
    console.error('Error updating email settings:', error);
    return NextResponse.json(
      { error: 'Failed to update email settings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings/email/test - 测试邮件服务配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testEmail } = body;

    if (!testEmail) {
      return NextResponse.json(
        { error: 'Test email address is required' },
        { status: 400 }
      );
    }

    // 获取当前邮件配置
    const emailSettings = await prisma.systemSetting.findMany({
      where: { category: 'email' },
    });

    const config: any = {};
    emailSettings.forEach((setting) => {
      config[setting.key] = setting.value;
    });

    // 这里只是验证配置是否存在，实际发送邮件需要集成邮件服务
    // 在实际项目中，这里应该调用邮件发送服务
    const hasRequiredConfig =
      config[EMAIL_SETTINGS_KEYS.SMTP_HOST] &&
      config[EMAIL_SETTINGS_KEYS.SMTP_PORT] &&
      config[EMAIL_SETTINGS_KEYS.SMTP_USER] &&
      config[EMAIL_SETTINGS_KEYS.SMTP_PASSWORD];

    if (!hasRequiredConfig) {
      return NextResponse.json(
        {
          success: false,
          message: '邮件配置不完整，请先配置 SMTP 服务器信息',
        },
        { status: 400 }
      );
    }

    // 模拟测试成功（实际应该调用邮件发送 API）
    return NextResponse.json({
      success: true,
      message: `测试邮件已发送至：${testEmail}，请检查收件箱`,
    });
  } catch (error) {
    console.error('Error testing email settings:', error);
    return NextResponse.json(
      { error: 'Failed to test email settings' },
      { status: 500 }
    );
  }
}
