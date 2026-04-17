---
file: YYC3-P3-安全-数据加密.md
description: 文档描述待补充
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-04-08
updated: 2026-04-08
status: stable
tags: [文档]
category: development
language: zh-CN
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

## 核心理念

**五高架构**: 高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**: 标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**: 流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**: 时间维 | 空间维 | 属性维 | 事件维 | 关联维


# YYC3-P3-安全-数据加密

## 🤖 AI 角色定义

You are a senior security architect and cryptography specialist with deep expertise in data encryption, secure key management, and cryptographic protocols for modern applications.

### Your Role & Expertise

You are an experienced security architect who specializes in:
- **Cryptography**: AES, RSA, ECDSA, SHA, HMAC, cryptographic algorithms
- **Encryption**: Symmetric encryption, asymmetric encryption, hybrid encryption
- **Key Management**: Key generation, key storage, key rotation, key derivation
- **Web Crypto API**: Browser cryptography, secure random number generation
- **Data Protection**: Data at rest, data in transit, data masking, tokenization
- **Compliance**: GDPR, HIPAA, SOC 2, PCI DSS, encryption standards
- **Best Practices**: Secure key storage, proper algorithm selection, secure coding
- **Standards**: NIST, FIPS 140-2, ISO/IEC 27001, cryptographic standards

### Code Standards

**IMPORTANT**: Please ensure all generated code files follow the team requirements specified in: `guidelines/YYC3-Code-header.md`

All code files must include proper file headers with:
- @file: File name/path
- @description: Clear description of file purpose
- @author: YanYuCloudCube Team <admin@0379.email>
- @version: Semantic version (v1.0.0)
- @created: Creation date (YYYY-MM-DD)
- @updated: Last update date (YYYY-MM-DD)
- @status: File status (draft/dev/test/stable/deprecated)
- @license: License type
- @copyright: Copyright notice
- @tags: Relevant tags for categorization

---

## 🔐 数据加密系统

### 系统概述

YYC3-AI Code Designer 的数据加密系统提供全面的数据保护措施，包括对称加密、非对称加密、哈希算法、密钥管理、数据脱敏、传输加密、存储加密等功能，确保数据在传输和存储过程中的安全性。

### 核心功能

#### 对称加密

```typescript
/**
 * 对称加密管理器
 */
export class SymmetricEncryption {
  private algorithm: string = 'AES-GCM';
  private keyLength: number = 256;

  /**
   * 生成密钥
   */
  async generateKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * 导出密钥
   */
  async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('jwk', key);
    return JSON.stringify(exported);
  }

  /**
   * 导入密钥
   */
  async importKey(keyData: string): Promise<CryptoKey> {
    const jwk = JSON.parse(keyData);
    return crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: this.algorithm,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * 加密
   */
  async encrypt(
    key: CryptoKey,
    plaintext: string,
    iv?: Uint8Array
  ): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const actualIv = iv || crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.algorithm,
        iv: actualIv,
      },
      key,
      data
    );

    return {
      ciphertext: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(actualIv),
      algorithm: this.algorithm,
    };
  }

  /**
   * 解密
   */
  async decrypt(
    key: CryptoKey,
    encryptedData: EncryptedData
  ): Promise<string> {
    const iv = this.base64ToArrayBuffer(encryptedData.iv);
    const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.algorithm,
        iv,
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * ArrayBuffer 转 Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Base64 转 ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

/**
 * 加密数据
 */
export interface EncryptedData {
  /** 密文 */
  ciphertext: string;

  /** 初始化向量 */
  iv: string;

  /** 算法 */
  algorithm: string;
}
```

#### 非对称加密

```typescript
/**
 * 非对称加密管理器
 */
export class AsymmetricEncryption {
  private algorithm: string = 'RSA-OAEP';
  private modulusLength: number = 2048;
  private publicExponent: Uint8Array = new Uint8Array([1, 0, 1]);

  /**
   * 生成密钥对
   */
  async generateKeyPair(): Promise<KeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: this.algorithm,
        modulusLength: this.modulusLength,
        publicExponent: this.publicExponent,
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    };
  }

  /**
   * 导出公钥
   */
  async exportPublicKey(publicKey: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('spki', publicKey);
    return this.arrayBufferToBase64(exported);
  }

  /**
   * 导出私钥
   */
  async exportPrivateKey(privateKey: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('pkcs8', privateKey);
    return this.arrayBufferToBase64(exported);
  }

  /**
   * 导入公钥
   */
  async importPublicKey(keyData: string): Promise<CryptoKey> {
    const buffer = this.base64ToArrayBuffer(keyData);
    return crypto.subtle.importKey(
      'spki',
      buffer,
      {
        name: this.algorithm,
        hash: 'SHA-256',
      },
      true,
      ['encrypt']
    );
  }

  /**
   * 导入私钥
   */
  async importPrivateKey(keyData: string): Promise<CryptoKey> {
    const buffer = this.base64ToArrayBuffer(keyData);
    return crypto.subtle.importKey(
      'pkcs8',
      buffer,
      {
        name: this.algorithm,
        hash: 'SHA-256',
      },
      true,
      ['decrypt']
    );
  }

  /**
   * 加密
   */
  async encrypt(
    publicKey: CryptoKey,
    plaintext: string
  ): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.algorithm,
      },
      publicKey,
      data
    );

    return this.arrayBufferToBase64(encrypted);
  }

  /**
   * 解密
   */
  async decrypt(
    privateKey: CryptoKey,
    ciphertext: string
  ): Promise<string> {
    const buffer = this.base64ToArrayBuffer(ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.algorithm,
      },
      privateKey,
      buffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * 签名
   */
  async sign(
    privateKey: CryptoKey,
    data: string
  ): Promise<string> {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(data);

    const signature = await crypto.subtle.sign(
      {
        name: 'RSA-PSS',
        saltLength: 32,
      },
      privateKey,
      buffer
    );

    return this.arrayBufferToBase64(signature);
  }

  /**
   * 验证签名
   */
  async verify(
    publicKey: CryptoKey,
    data: string,
    signature: string
  ): Promise<boolean> {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(data);
    const signatureBuffer = this.base64ToArrayBuffer(signature);

    return crypto.subtle.verify(
      {
        name: 'RSA-PSS',
        saltLength: 32,
      },
      publicKey,
      signatureBuffer,
      buffer
    );
  }

  /**
   * ArrayBuffer 转 Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Base64 转 ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

/**
 * 密钥对
 */
export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}
```

#### 哈希算法

```typescript
/**
 * 哈希管理器
 */
export class HashManager {
  /**
   * 计算哈希
   */
  async hash(data: string, algorithm: HashAlgorithm = 'SHA-256'): Promise<string> {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(data);

    const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
    return this.arrayBufferToHex(hashBuffer);
  }

  /**
   * 计算文件哈希
   */
  async hashFile(file: File, algorithm: HashAlgorithm = 'SHA-256'): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
    return this.arrayBufferToHex(hashBuffer);
  }

  /**
   * HMAC
   */
  async hmac(
    key: string,
    data: string,
    algorithm: HashAlgorithm = 'SHA-256'
  ): Promise<string> {
    const encoder = new TextEncoder();
    const keyBuffer = encoder.encode(key);
    const dataBuffer = encoder.encode(data);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: algorithm },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
    return this.arrayBufferToHex(signature);
  }

  /**
   * PBKDF2
   */
  async pbkdf2(
    password: string,
    salt: string,
    iterations: number = 100000,
    algorithm: HashAlgorithm = 'SHA-256'
  ): Promise<string> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = encoder.encode(salt);

    const key = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations,
        hash: algorithm,
      },
      key,
      256
    );

    return this.arrayBufferToHex(bits);
  }

  /**
   * ArrayBuffer 转 Hex
   */
  private arrayBufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }
}

/**
 * 哈希算法
 */
export type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
```

#### 密钥管理

```typescript
/**
 * 密钥管理器
 */
export class KeyManager {
  private keys: Map<string, StoredKey> = new Map();
  private keyRotationInterval: number = 30 * 24 * 60 * 60 * 1000; // 30 days

  /**
   * 存储密钥
   */
  async storeKey(keyId: string, key: CryptoKey, metadata?: KeyMetadata): Promise<void> {
    const keyData = await this.exportKey(key);
    const storedKey: StoredKey = {
      id: keyId,
      keyData,
      algorithm: key.algorithm,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.keyRotationInterval,
      metadata,
    };

    this.keys.set(keyId, storedKey);
  }

  /**
   * 获取密钥
   */
  async getKey(keyId: string): Promise<CryptoKey | null> {
    const storedKey = this.keys.get(keyId);
    if (!storedKey) {
      return null;
    }

    if (storedKey.expiresAt < Date.now()) {
      this.keys.delete(keyId);
      return null;
    }

    return this.importKey(storedKey.keyData, storedKey.algorithm);
  }

  /**
   * 删除密钥
   */
  deleteKey(keyId: string): boolean {
    return this.keys.delete(keyId);
  }

  /**
   * 旋转密钥
   */
  async rotateKey(keyId: string, newKey: CryptoKey): Promise<void> {
    const oldKey = await this.getKey(keyId);
    if (oldKey) {
      await this.deleteKey(keyId);
    }

    await this.storeKey(keyId, newKey);
  }

  /**
   * 列出所有密钥
   */
  listKeys(): StoredKey[] {
    return Array.from(this.keys.values());
  }

  /**
   * 导出密钥
   */
  private async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('jwk', key);
    return JSON.stringify(exported);
  }

  /**
   * 导入密钥
   */
  private async importKey(keyData: string, algorithm: string): Promise<CryptoKey> {
    const jwk = JSON.parse(keyData);
    return crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: algorithm },
      true,
      ['encrypt', 'decrypt']
    );
  }
}

/**
 * 存储的密钥
 */
export interface StoredKey {
  id: string;
  keyData: string;
  algorithm: string;
  createdAt: number;
  expiresAt: number;
  metadata?: KeyMetadata;
}

/**
 * 密钥元数据
 */
export interface KeyMetadata {
  owner?: string;
  purpose?: string;
  tags?: string[];
}
```

#### 数据脱敏

```typescript
/**
 * 数据脱敏器
 */
export class DataMasker {
  /**
   * 脱敏邮箱
   */
  maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    if (username.length <= 2) {
      return `${username[0]}***@${domain}`;
    }
    return `${username[0]}${'*'.repeat(username.length - 2)}${username[username.length - 1]}@${domain}`;
  }

  /**
   * 脱敏手机号
   */
  maskPhone(phone: string): string {
    if (phone.length < 7) {
      return '*'.repeat(phone.length);
    }
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
  }

  /**
   * 脱敏身份证号
   */
  maskIdCard(idCard: string): string {
    if (idCard.length < 8) {
      return '*'.repeat(idCard.length);
    }
    return `${idCard.slice(0, 4)}**********${idCard.slice(-4)}`;
  }

  /**
   * 脱敏银行卡号
   */
  maskBankCard(cardNumber: string): string {
    if (cardNumber.length < 8) {
      return '*'.repeat(cardNumber.length);
    }
    return `${cardNumber.slice(0, 4)}${'*'.repeat(cardNumber.length - 8)}${cardNumber.slice(-4)}`;
  }

  /**
   * 脱敏姓名
   */
  maskName(name: string): string {
    if (name.length <= 1) {
      return '*';
    }
    return `${name[0]}${'*'.repeat(name.length - 1)}`;
  }

  /**
   * 脱敏地址
   */
  maskAddress(address: string): string {
    if (address.length <= 4) {
      return '*'.repeat(address.length);
    }
    return `${address.slice(0, 4)}${'*'.repeat(address.length - 4)}`;
  }

  /**
   * 脱敏 IP 地址
   */
  maskIP(ip: string): string {
    const parts = ip.split('.');
    if (parts.length !== 4) {
      return '*'.repeat(ip.length);
    }
    return `${parts[0]}.${parts[1]}.*.*`;
  }

  /**
   * 脱敏通用字符串
   */
  maskString(str: string, keepStart: number = 2, keepEnd: number = 2): string {
    if (str.length <= keepStart + keepEnd) {
      return '*'.repeat(str.length);
    }
    return `${str.slice(0, keepStart)}${'*'.repeat(str.length - keepStart - keepEnd)}${str.slice(-keepEnd)}`;
  }
}
```

#### 传输加密

```typescript
/**
 * 传输加密管理器
 */
export class TransportEncryption {
  private symmetricEncryption: SymmetricEncryption;
  private keyManager: KeyManager;

  constructor() {
    this.symmetricEncryption = new SymmetricEncryption();
    this.keyManager = new KeyManager();
  }

  /**
   * 生成会话密钥
   */
  async generateSessionKey(sessionId: string): Promise<CryptoKey> {
    const key = await this.symmetricEncryption.generateKey();
    await this.keyManager.storeKey(sessionId, key);
    return key;
  }

  /**
   * 加密消息
   */
  async encryptMessage(
    sessionId: string,
    message: string
  ): Promise<EncryptedMessage> {
    const key = await this.keyManager.getKey(sessionId);
    if (!key) {
      throw new Error('Session key not found');
    }

    const encrypted = await this.symmetricEncryption.encrypt(key, message);
    const signature = await this.signMessage(message);

    return {
      ...encrypted,
      signature,
      timestamp: Date.now(),
    };
  }

  /**
   * 解密消息
   */
  async decryptMessage(
    sessionId: string,
    encryptedMessage: EncryptedMessage
  ): Promise<string> {
    const key = await this.keyManager.getKey(sessionId);
    if (!key) {
      throw new Error('Session key not found');
    }

    const decrypted = await this.symmetricEncryption.decrypt(
      key,
      encryptedMessage
    );

    if (encryptedMessage.signature) {
      const isValid = await this.verifyMessage(
        decrypted,
        encryptedMessage.signature
      );
      if (!isValid) {
        throw new Error('Message signature verification failed');
      }
    }

    return decrypted;
  }

  /**
   * 签名消息
   */
  private async signMessage(message: string): Promise<string> {
    const hashManager = new HashManager();
    return hashManager.hash(message);
  }

  /**
   * 验证消息
   */
  private async verifyMessage(
    message: string,
    signature: string
  ): Promise<boolean> {
    const hashManager = new HashManager();
    const computedSignature = await hashManager.hash(message);
    return computedSignature === signature;
  }

  /**
   * 销毁会话
   */
  async destroySession(sessionId: string): Promise<void> {
    this.keyManager.deleteKey(sessionId);
  }
}

/**
 * 加密消息
 */
export interface EncryptedMessage extends EncryptedData {
  signature?: string;
  timestamp: number;
}
```

#### 存储加密

```typescript
/**
 * 存储加密管理器
 */
export class StorageEncryption {
  private symmetricEncryption: SymmetricEncryption;
  private keyManager: KeyManager;
  private masterKeyId: string = 'master-key';

  constructor() {
    this.symmetricEncryption = new SymmetricEncryption();
    this.keyManager = new KeyManager();
  }

  /**
   * 初始化
   */
  async initialize(): Promise<void> {
    let masterKey = await this.keyManager.getKey(this.masterKeyId);
    if (!masterKey) {
      masterKey = await this.symmetricEncryption.generateKey();
      await this.keyManager.storeKey(this.masterKeyId, masterKey);
    }
  }

  /**
   * 加密数据
   */
  async encryptData(data: any): Promise<EncryptedStorageData> {
    const key = await this.keyManager.getKey(this.masterKeyId);
    if (!key) {
      throw new Error('Master key not found');
    }

    const json = JSON.stringify(data);
    const encrypted = await this.symmetricEncryption.encrypt(key, json);

    return {
      ...encrypted,
      version: '1.0',
      encryptedAt: Date.now(),
    };
  }

  /**
   * 解密数据
   */
  async decryptData(encryptedData: EncryptedStorageData): Promise<any> {
    const key = await this.keyManager.getKey(this.masterKeyId);
    if (!key) {
      throw new Error('Master key not found');
    }

    const decrypted = await this.symmetricEncryption.decrypt(key, encryptedData);
    return JSON.parse(decrypted);
  }

  /**
   * 加密文件
   */
  async encryptFile(file: File): Promise<EncryptedFile> {
    const key = await this.keyManager.getKey(this.masterKeyId);
    if (!key) {
      throw new Error('Master key not found');
    }

    const buffer = await file.arrayBuffer();
    const encrypted = await this.symmetricEncryption.encrypt(
      key,
      this.arrayBufferToBase64(buffer)
    );

    return {
      ...encrypted,
      name: file.name,
      size: file.size,
      type: file.type,
      version: '1.0',
      encryptedAt: Date.now(),
    };
  }

  /**
   * 解密文件
   */
  async decryptFile(encryptedFile: EncryptedFile): Promise<Blob> {
    const key = await this.keyManager.getKey(this.masterKeyId);
    if (!key) {
      throw new Error('Master key not found');
    }

    const decrypted = await this.symmetricEncryption.decrypt(key, encryptedFile);
    const buffer = this.base64ToArrayBuffer(decrypted);

    return new Blob([buffer], { type: encryptedFile.type });
  }

  /**
   * ArrayBuffer 转 Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Base64 转 ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

/**
 * 加密存储数据
 */
export interface EncryptedStorageData extends EncryptedData {
  version: string;
  encryptedAt: number;
}

/**
 * 加密文件
 */
export interface EncryptedFile extends EncryptedStorageData {
  name: string;
  size: number;
  type: string;
}
```

#### 加密工具

```typescript
/**
 * 加密工具类
 */
export class EncryptionUtils {
  /**
   * 生成随机字符串
   */
  static generateRandomString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => chars[byte % chars.length]).join('');
  }

  /**
   * 生成随机字节
   */
  static generateRandomBytes(length: number): Uint8Array {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
  }

  /**
   * 生成 UUID
   */
  static generateUUID(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    array[6] = (array[6] & 0x0f) | 0x40;
    array[8] = (array[8] & 0x3f) | 0x80;

    const hex = Array.from(array, (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  /**
   * Base64 编码
   */
  static base64Encode(data: string): string {
    return btoa(data);
  }

  /**
   * Base64 解码
   */
  static base64Decode(data: string): string {
    return atob(data);
  }

  /**
   * Hex 编码
   */
  static hexEncode(data: string): string {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(data);
    return Array.from(new Uint8Array(buffer), (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');
  }

  /**
   * Hex 解码
   */
  static hexDecode(hex: string): string {
    const bytes = new Uint8Array(
      hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }

  /**
   * 比较两个值是否相等（防时序攻击）
   */
  static timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}
```

---

## ✅ 验收标准

### 功能完整性

- [ ] 对称加密功能完整
- [ ] 非对称加密功能完整
- [ ] 哈希算法功能完整
- [ ] 密钥管理功能完整
- [ ] 数据脱敏功能完整
- [ ] 传输加密功能完整
- [ ] 存储加密功能完整
- [ ] 加密工具功能完整
- [ ] 密钥轮换功能完整
- [ ] 加密性能优化到位

### 代码质量

- [ ] TypeScript 类型定义完整
- [ ] 代码安全性高
- [ ] 错误处理完善
- [ ] 性能优化到位
- [ ] 代码可维护性强

### 安全性

- [ ] 加密算法安全
- [ ] 密钥管理安全
- [ ] 无已知安全漏洞
- [ ] 通过安全审计
- [ ] 符合加密最佳实践

---

## 📚 相关文档

- [YYC3-P3-安全-安全加固.md](./YYC3-P3-安全-安全加固.md)
- [YYC3-P0-架构-类型定义.md](../P0-核心架构/YYC3-P0-架构-类型定义.md)
- [YYC3-变量-配置参数.md](../变量词库/YYC3-变量-配置参数.md)

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>


---

## 文档追溯信息

| 属性 | 值 |
|------|-----|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-04-08 |
| 更新日期 | 2026-04-08 |
| 内容校验 | ff17e91372586296 |
| 追溯ID | TRC-20260408141610 |
| 关联文档 | 无 |

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
</div>
