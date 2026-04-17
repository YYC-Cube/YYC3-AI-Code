/**
 * @file gen-yanyu-cloud-logo.js
 * @description 言语云 Logo 批量生成脚本 - PWA + Web + 桌面全尺寸
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version 1.0.0
 * @created 2026-04-08
 * @updated 2026-04-08
 * @license MIT
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 言语云 Logo 专属尺寸：PWA + Web + 桌面 全刚需
const sizes = [16, 32, 48, 64, 128, 192, 256, 512];
const inputPath = path.join(__dirname, 'yanyu-cloud-logo.png');
const outDir = path.join(__dirname, 'yanyu-cloud-logo-dist');

// 创建输出文件夹
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// 批量生成透明底PNG
async function generateLogos() {
  console.log('🎨 言语云 Logo 生成器启动...\n');
  console.log(`📁 输入文件: ${inputPath}`);
  console.log(`📁 输出目录: ${outDir}\n`);

  // 检查输入文件是否存在
  if (!fs.existsSync(inputPath)) {
    console.error('❌ 错误: 找不到输入文件 yanyu-cloud-logo.png');
    process.exit(1);
  }

  for (const size of sizes) {
    const outputPath = path.join(outDir, `yanyu_cloud_${size}x${size}.png`);
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain', // 等比例缩放，不裁切Logo
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // 透明底
        kernel: sharp.kernel.lanczos3 // 高清缩放算法，保证Logo清晰
      })
      .png({ quality: 100, compressionLevel: 9 }) // 最高质量+最大压缩
      .toFile(outputPath);
    console.log(`✅ 生成完成: yanyu_cloud_${size}x${size}.png`);
  }

  // 额外生成Windows用favicon.ico（内嵌16/32/48/256尺寸）
  const icoPath = path.join(outDir, 'favicon.ico');
  await sharp(inputPath)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(icoPath);
  console.log(`✅ 生成完成: favicon.ico`);

  // 生成 Mac 桌面 ICNS（如果需要）
  // macOS 用户可以手动运行: sips -s format icns yanyu_cloud_512x512.png --out yanyu_cloud.icns

  console.log('\n🎉 言语云 Logo 全尺寸生成完毕！');
  console.log(`📂 输出文件夹: ${outDir}`);
  console.log('\n📋 生成的文件列表:');
  sizes.forEach(size => {
    console.log(`   - yanyu_cloud_${size}x${size}.png`);
  });
  console.log('   - favicon.ico');
  console.log('\n💡 提示: Mac 用户可运行以下命令生成 .icns 文件:');
  console.log('   sips -s format icns yanyu-cloud-logo-dist/yanyu_cloud_512x512.png --out yanyu-cloud-logo-dist/yanyu_cloud.icns');
}

generateLogos().catch(err => {
  console.error('❌ 生成失败:', err);
  process.exit(1);
});
