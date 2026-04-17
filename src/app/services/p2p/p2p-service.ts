/**
 * YYC³ AI - P2P Service (WebRTC)
 * 
 * 主题：智亦师亦友亦伯乐，谱一言一语一华章
 * 谱奏人机共生协同的AI Family乐章
 * 
 * @module P2PService
 * @description P2P 直连服务，提供点对点通信功能
 * @author YYC³ AI Team
 * @version 2.0.0
 * @license MIT
 * @copyright © 2026 YYC³ AI. All rights reserved.
 */

import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../../utils/logger';

const log = createLogger('P2PService');

/**
 * P2P 服务接口
 */
export interface IP2PService {
  // 连接管理
  connect(peerId: string): Promise<void>;
  disconnect(): void;
  getConnectionState(): RTCPeerConnectionState;
  
  // 数据传输
  send(data: any): void;
  onData(callback: (data: any) => void): () => void;
  
  // 信令
  createOffer(): Promise<RTCSessionDescription>;
  createAnswer(offer: RTCSessionDescription): Promise<RTCSessionDescription>;
  setRemoteDescription(description: RTCSessionDescription): Promise<void>;
  addIceCandidate(candidate: RTCIceCandidate): Promise<void>;
  
  // 事件管理
  onConnectionChange(callback: (state: RTCPeerConnectionState) => void): () => void;
  onIceCandidate(callback: (candidate: RTCIceCandidate) => void): () => void;
  
  // 销毁
  destroy(): void;
}

/**
 * P2P 服务配置
 */
export interface P2PServiceConfig {
  /** STUN 服务器 */
  stunServers?: string[];
  /** TURN 服务器 */
  turnServers?: {
    urls: string[];
    username: string;
    credential: string;
  }[];
  /** 数据通道名称 */
  dataChannelName?: string;
  /** 是否启用数据通道 */
  enableDataChannel?: boolean;
}

/**
 * P2P 服务实现
 */
export class P2PService implements IP2PService {
  private peerConnection: RTCPeerConnection;
  private dataChannel: RTCDataChannel | null = null;
  private peerId: string;
  private remotePeerId: string | null = null;
  
  private dataCallbacks: Set<(data: any) => void> = new Set();
  private connectionChangeCallbacks: Set<(state: RTCPeerConnectionState) => void> = new Set();
  private iceCandidateCallbacks: Set<(candidate: RTCIceCandidate) => void> = new Set();
  private destroyCallbacks: Set<() => void> = new Set();

  constructor(private config: P2PServiceConfig = {}) {
    this.peerId = uuidv4();
    this.peerConnection = this.createPeerConnection();
    this.initializeDataChannel();
    this.setupPeerConnectionListeners();
  }

  /**
   * 创建 PeerConnection
   */
  private createPeerConnection(): RTCPeerConnection {
    const iceServers: RTCIceServer[] = [];

    // 添加 STUN 服务器
    if (this.config.stunServers) {
      this.config.stunServers.forEach((url) => {
        iceServers.push({ urls: url });
      });
    } else {
      // 默认 STUN 服务器
      iceServers.push(
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      );
    }

    // 添加 TURN 服务器
    if (this.config.turnServers) {
      this.config.turnServers.forEach((turn) => {
        iceServers.push({
          urls: turn.urls,
          username: turn.username,
          credential: turn.credential,
        });
      });
    }

    return new RTCPeerConnection({ iceServers });
  }

  /**
   * 初始化数据通道
   */
  private initializeDataChannel() {
    if (this.config.enableDataChannel !== false) {
      const dataChannelName = this.config.dataChannelName || 'data';
      this.dataChannel = this.peerConnection.createDataChannel(dataChannelName);
      this.setupDataChannelListeners(this.dataChannel);
    }
  }

  /**
   * 设置 PeerConnection 监听器
   */
  private setupPeerConnectionListeners() {
    this.peerConnection.addEventListener('icecandidate', (event) => {
      if (event.candidate) {
        this.iceCandidateCallbacks.forEach((cb) => cb(event.candidate!));
      }
    });

    this.peerConnection.addEventListener('connectionstatechange', () => {
      const state = this.peerConnection.connectionState;
      this.connectionChangeCallbacks.forEach((cb) => cb(state));
    });

    this.peerConnection.addEventListener('datachannel', (event) => {
      this.setupDataChannelListeners(event.channel);
    });
  }

  /**
   * 设置数据通道监听器
   */
  private setupDataChannelListeners(dataChannel: RTCDataChannel) {
    dataChannel.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        this.dataCallbacks.forEach((cb) => cb(data));
      } catch (error) {
        log.error('Failed to parse data:', error);
      }
    });

    dataChannel.addEventListener('open', () => {
      log.debug('Data channel opened');
    });

    dataChannel.addEventListener('close', () => {
      log.debug('Data channel closed');
    });

    dataChannel.addEventListener('error', (error) => {
      log.error('Data channel error:', error);
    });
  }

  /**
   * 连接到远程节点
   */
  async connect(peerId: string): Promise<void> {
    this.remotePeerId = peerId;
    
    const offer = await this.createOffer();
    // 这里需要通过信令服务器发送 offer
    // 实际实现中需要信令服务器支持
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.peerConnection.close();
  }

  /**
   * 获取连接状态
   */
  getConnectionState(): RTCPeerConnectionState {
    return this.peerConnection.connectionState;
  }

  /**
   * 发送数据
   */
  send(data: any): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(data));
    } else {
      log.warn('Data channel is not open');
    }
  }

  /**
   * 监听数据接收
   */
  onData(callback: (data: any) => void): () => void {
    this.dataCallbacks.add(callback);

    return () => {
      this.dataCallbacks.delete(callback);
    };
  }

  /**
   * 创建 Offer
   */
  async createOffer(): Promise<RTCSessionDescription> {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer as RTCSessionDescription;
  }

  /**
   * 创建 Answer
   */
  async createAnswer(offer: RTCSessionDescription): Promise<RTCSessionDescription> {
    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer as RTCSessionDescription;
  }

  /**
   * 设置远程描述
   */
  async setRemoteDescription(description: RTCSessionDescription): Promise<void> {
    await this.peerConnection.setRemoteDescription(description);
  }

  /**
   * 添加 ICE Candidate
   */
  async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    await this.peerConnection.addIceCandidate(candidate);
  }

  /**
   * 监听连接状态变化
   */
  onConnectionChange(callback: (state: RTCPeerConnectionState) => void): () => void {
    this.connectionChangeCallbacks.add(callback);

    return () => {
      this.connectionChangeCallbacks.delete(callback);
    };
  }

  /**
   * 监听 ICE Candidate
   */
  onIceCandidate(callback: (candidate: RTCIceCandidate) => void): () => void {
    this.iceCandidateCallbacks.add(callback);

    return () => {
      this.iceCandidateCallbacks.delete(callback);
    };
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.disconnect();
    this.dataCallbacks.clear();
    this.connectionChangeCallbacks.clear();
    this.iceCandidateCallbacks.clear();
    this.destroyCallbacks.forEach((cb) => cb());
    this.destroyCallbacks.clear();
  }

  /**
   * 获取本地 Peer ID
   */
  getPeerId(): string {
    return this.peerId;
  }
}

/**
 * 创建 P2P 服务实例
 */
export function createP2PService(config?: P2PServiceConfig): P2PService {
  return new P2PService(config);
}

/**
 * 单例 P2P 服务
 */
let singletonP2PService: P2PService | null = null;

/**
 * 获取或创建单例 P2P 服务
 */
export function getP2PService(config?: P2PServiceConfig): P2PService {
  if (!singletonP2PService) {
    singletonP2PService = new P2PService(config);
  }

  return singletonP2PService;
}

/**
 * 销毁单例 P2P 服务
 */
export function destroyP2PService(): void {
  if (singletonP2PService) {
    singletonP2PService.destroy();
    singletonP2PService = null;
  }
}

export default P2PService;
