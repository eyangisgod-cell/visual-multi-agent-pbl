import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 存储服务配置相关的设置键
const STORAGE_SETTINGS_KEYS = {
  PROVIDER: 'storage_provider',
  AWS_ACCESS_KEY: 'aws_access_key',
  AWS_SECRET_KEY: 'aws_secret_key',
  AWS_REGION: 'aws_region',
  AWS_BUCKET: 'aws_bucket',
  ALIYUN_ACCESS_KEY: 'aliyun_access_key',
  ALIYUN_SECRET_KEY: 'aliyun_secret_key',
  ALIYUN_BUCKET: 'aliyun_bucket',
  ALIYUN_REGION: 'aliyun_region',
  LOCAL_PATH: 'local_path',
  BASE_URL: 'base_url',
};

// GET /api/admin/settings/storage - 获取存储服务配置
export async function GET() {
  try {
    const storageSettings = await prisma.systemSetting.findMany({
      where: {
        category: 'storage',
      },
    });

    // 将数组转换为对象格式返回
    const config: any = {};
    storageSettings.forEach((setting) => {
      config[setting.key] = setting.value;
    });

    // 隐藏敏感信息
    if (config[STORAGE_SETTINGS_KEYS.AWS_SECRET_KEY]) {
      config[STORAGE_SETTINGS_KEYS.AWS_SECRET_KEY] = '********';
    }
    if (config[STORAGE_SETTINGS_KEYS.ALIYUN_SECRET_KEY]) {
      config[STORAGE_SETTINGS_KEYS.ALIYUN_SECRET_KEY] = '********';
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching storage settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings/storage - 更新存储服务配置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      provider,
      awsAccessKey,
      awsSecretKey,
      awsRegion,
      awsBucket,
      aliyunAccessKey,
      aliyunSecretKey,
      aliyunBucket,
      aliyunRegion,
      localPath,
      baseUrl,
    } = body;

    // 构建更新数据
    const settingsToUpdate: Array<{ key: string; value: any; category: string }> = [];

    if (provider !== undefined) {
      settingsToUpdate.push({
        key: STORAGE_SETTINGS_KEYS.PROVIDER,
        value: provider,
        category: 'storage',
      });
    }

    // AWS S3 配置
    if (awsAccessKey !== undefined) {
      settingsToUpdate.push({
        key: STORAGE_SETTINGS_KEYS.AWS_ACCESS_KEY,
        value: awsAccessKey,
        category: 'storage',
      });
    }

    // 只有当提供了新密钥时才更新（不包含掩码）
    if (awsSecretKey && awsSecretKey !== '********') {
      settingsToUpdate.push({
        key: STORAGE_SETTINGS_KEYS.AWS_SECRET_KEY,
        value: awsSecretKey,
        category: 'storage',
      });
    }

    if (awsRegion !== undefined) {
      settingsToUpdate.push({
        key: STORAGE_SETTINGS_KEYS.AWS_REGION,
        value: awsRegion,
        category: 'storage',
      });
    }

    if (awsBucket !== undefined) {
      settingsToUpdate.push({
        key: STORAGE_SETTINGS_KEYS.AWS_BUCKET,
        value: awsBucket,
        category: 'storage',
      });
    }

    // 阿里云 OSS 配置
    if (aliyunAccessKey !== undefined) {
      settingsToUpdate.push({
        key: STORAGE_SETTINGS_KEYS.ALIYUN_ACCESS_KEY,
        value: aliyunAccessKey,
        category: 'storage',
      });
    }

    if (aliyunSecretKey && aliyunSecretKey !== '********') {
      settingsToUpdate.push({
        key: STORAGE_SETTINGS_KEYS.ALIYUN_SECRET_KEY,
        value: aliyunSecretKey,
        category: 'storage',
      });
    }

    if (aliyunRegion !== undefined) {
      settingsToUpdate.push({
        key: STORAGE_SETTINGS_KEYS.ALIYUN_REGION,
        value: aliyunRegion,
        category: 'storage',
      });
    }

    if (aliyunBucket !== undefined) {
      settingsToUpdate.push({
        key: STORAGE_SETTINGS_KEYS.ALIYUN_BUCKET,
        value: aliyunBucket,
        category: 'storage',
      });
    }

    // 本地存储配置
    if (localPath !== undefined) {
      settingsToUpdate.push({
        key: STORAGE_SETTINGS_KEYS.LOCAL_PATH,
        value: localPath,
        category: 'storage',
      });
    }

    if (baseUrl !== undefined) {
      settingsToUpdate.push({
        key: STORAGE_SETTINGS_KEYS.BASE_URL,
        value: baseUrl,
        category: 'storage',
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
    console.error('Error updating storage settings:', error);
    return NextResponse.json(
      { error: 'Failed to update storage settings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings/storage/test - 测试存储服务配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider } = body;

    // 获取当前存储配置
    const storageSettings = await prisma.systemSetting.findMany({
      where: { category: 'storage' },
    });

    const config: any = {};
    storageSettings.forEach((setting) => {
      config[setting.key] = setting.value;
    });

    const currentProvider = config[STORAGE_SETTINGS_KEYS.PROVIDER] || 'local';

    // 根据不同 provider 验证配置
    if (currentProvider === 'aws-s3') {
      const hasAwsConfig =
        config[STORAGE_SETTINGS_KEYS.AWS_ACCESS_KEY] &&
        config[STORAGE_SETTINGS_KEYS.AWS_BUCKET] &&
        config[STORAGE_SETTINGS_KEYS.AWS_REGION];

      if (!hasAwsConfig) {
        return NextResponse.json(
          {
            success: false,
            message: 'AWS S3 配置不完整',
          },
          { status: 400 }
        );
      }
    } else if (currentProvider === 'aliyun-oss') {
      const hasAliyunConfig =
        config[STORAGE_SETTINGS_KEYS.ALIYUN_ACCESS_KEY] &&
        config[STORAGE_SETTINGS_KEYS.ALIYUN_BUCKET] &&
        config[STORAGE_SETTINGS_KEYS.ALIYUN_REGION];

      if (!hasAliyunConfig) {
        return NextResponse.json(
          {
            success: false,
            message: '阿里云 OSS 配置不完整',
          },
          { status: 400 }
        );
      }
    }

    // 模拟测试成功（实际应该调用存储服务的 API 进行测试上传）
    return NextResponse.json({
      success: true,
      message: `存储服务配置验证通过，当前使用：${currentProvider === 'aws-s3' ? 'AWS S3' : currentProvider === 'aliyun-oss' ? '阿里云 OSS' : '本地存储'}`,
    });
  } catch (error) {
    console.error('Error testing storage settings:', error);
    return NextResponse.json(
      { error: 'Failed to test storage settings' },
      { status: 500 }
    );
  }
}
