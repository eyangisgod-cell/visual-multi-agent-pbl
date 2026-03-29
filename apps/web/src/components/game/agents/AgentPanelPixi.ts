/**
 * AgentPanel PixiJS Component
 *
 * In-game agent selection panel rendered with PixiJS.
 * Provides interactive agent cards within the game scene.
 */

import {
  Container,
  Graphics,
  Text,
  TextStyle,
  FederatedPointerEvent,
} from 'pixi.js';
import { AgentType, AGENT_CONFIGS, AgentSprite, AgentStatus } from './index';

// Extended container to store agent card data
interface AgentCardContainer extends Container {
  agentCardData?: {
    bg: Graphics;
    selectionIndicator: Graphics;
    checkmark: Graphics;
    statusDot: Graphics;
    statusLabel: Text;
    agentType: AgentType;
    isSelected: boolean;
    status: AgentStatus;
  };
}

export interface AgentPanelOptions {
  x: number;
  y: number;
  width?: number;
  height?: number;
  maxSelection?: number;
  backgroundColor?: number;
  headerColor?: number;
}

export interface AgentCardData {
  type: AgentType;
  isSelected: boolean;
  status: AgentStatus;
  sprite?: AgentSprite;
}

export class AgentPanelPixi extends Container {
  private background: Graphics;
  private header: Graphics;
  private titleLabel: Text;
  private closeButton: Graphics;
  private closeButtonLabel: Text;
  private cardsContainer: Container;
  private scrollIndicator: Graphics;

  private options: Required<AgentPanelOptions>;
  private cards: Map<AgentType, AgentCardData> = new Map();
  private selectedAgents: AgentType[] = [];
  private isCollapsed: boolean = false;

  // Callbacks
  public onAgentToggle?: (agentType: AgentType, isSelected: boolean) => void;
  public onClose?: () => void;

  constructor(options: AgentPanelOptions) {
    super();

    this.options = {
      x: options.x,
      y: options.y,
      width: options.width ?? 320,
      height: options.height ?? 480,
      maxSelection: options.maxSelection ?? 3,
      backgroundColor: options.backgroundColor ?? 0xFFFFFF,
      headerColor: options.headerColor ?? 0xF8FAFC,
    };

    this.x = options.x;
    this.y = options.y;

    // Create components
    this.background = this.createBackground();
    this.header = this.createHeader();
    this.titleLabel = this.createTitleLabel();
    this.closeButton = this.createCloseButton();
    this.closeButtonLabel = this.createCloseButtonLabel();
    this.cardsContainer = this.createCardsContainer();
    this.scrollIndicator = this.createScrollIndicator();

    // Add children
    this.addChild(this.background);
    this.addChild(this.header);
    this.addChild(this.titleLabel);
    this.addChild(this.closeButton);
    this.addChild(this.closeButtonLabel);
    this.addChild(this.cardsContainer);
    this.addChild(this.scrollIndicator);

    // Initialize cards for all agent types
    this.initializeCards();

    // Setup interactivity
    this.setupInteractivity();

    // Hide scroll indicator initially
    this.scrollIndicator.visible = false;
  }

  /**
   * Create panel background
   */
  private createBackground(): Graphics {
    const graphics = new Graphics();
    graphics.beginFill(this.options.backgroundColor);
    graphics.lineStyle(2, 0xE2E8F0);
    graphics.drawRoundedRect(0, 0, this.options.width, this.options.height, 12);
    graphics.endFill();

    return graphics;
  }

  /**
   * Create header section
   */
  private createHeader(): Graphics {
    const graphics = new Graphics();
    graphics.beginFill(this.options.headerColor);
    graphics.drawRect(0, 0, this.options.width, 60);
    graphics.endFill();

    // Bottom border
    graphics.lineStyle(1, 0xE2E8F0);
    graphics.moveTo(0, 60);
    graphics.lineTo(this.options.width, 60);

    return graphics;
  }

  /**
   * Create title label
   */
  private createTitleLabel(): Text {
    const style = new TextStyle({
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0x1E293B,
    });

    const text = new Text('选择智能体', style);
    text.anchor.set(0, 0.5);
    text.x = 16;
    text.y = 30;

    return text;
  }

  /**
   * Create close button
   */
  private createCloseButton(): Graphics {
    const graphics = new Graphics();
    graphics.beginFill(0xF1F5F9);
    graphics.drawCircle(this.options.width - 24, 30, 16);
    graphics.endFill();

    graphics.lineStyle(2, 0x64748B);
    graphics.moveTo(this.options.width - 30, 24);
    graphics.lineTo(this.options.width - 18, 30);
    graphics.moveTo(this.options.width - 18, 24);
    graphics.lineTo(this.options.width - 30, 30);

    return graphics;
  }

  /**
   * Create close button label (X symbol)
   */
  private createCloseButtonLabel(): Text {
    const style = new TextStyle({
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0x64748B,
    });

    const text = new Text('×', style);
    text.anchor.set(0.5);
    text.x = this.options.width - 24;
    text.y = 32;

    return text;
  }

  /**
   * Create cards container
   */
  private createCardsContainer(): Container {
    const container = new Container();
    container.x = 16;
    container.y = 76;
    return container;
  }

  /**
   * Create scroll indicator
   */
  private createScrollIndicator(): Graphics {
    const graphics = new Graphics();
    graphics.beginFill(0xCBD5E1, 0.5);
    graphics.drawRoundedRect(this.options.width - 8, 70, 4, 30, 2);
    graphics.endFill();

    return graphics;
  }

  /**
   * Initialize cards for all agent types
   */
  private initializeCards(): void {
    const agentTypes = Object.keys(AGENT_CONFIGS) as AgentType[];
    const cardWidth = (this.options.width - 48) / 2;
    const cardHeight = 140;
    const gap = 12;

    agentTypes.forEach((agentType, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;

      const cardData: AgentCardData = {
        type: agentType,
        isSelected: false,
        status: 'idle',
      };

      this.cards.set(agentType, cardData);

      const card = this.createAgentCard(
        agentType,
        col * (cardWidth + gap),
        row * (cardHeight + gap),
        cardWidth,
        cardHeight
      );

      this.cardsContainer.addChild(card);
    });
  }

  /**
   * Create individual agent card
   */
  private createAgentCard(
    agentType: AgentType,
    x: number,
    y: number,
    width: number,
    height: number
  ): Container {
    const container = new Container();
    container.x = x;
    container.y = y;

    const config = AGENT_CONFIGS[agentType];
    const colors = this.getAgentColors(agentType);

    // Card background
    const bg = new Graphics();
    bg.beginFill(colors.bg, 0.5);
    bg.lineStyle(2, colors.border);
    bg.drawRoundedRect(0, 0, width, height, 8);
    bg.endFill();
    container.addChild(bg);

    // Selection indicator (hidden by default)
    const selectionIndicator = new Graphics();
    selectionIndicator.beginFill(0xEAB308);
    selectionIndicator.drawCircle(width - 12, 12, 10);
    selectionIndicator.visible = false;
    container.addChild(selectionIndicator);

    // Checkmark for selection
    const checkmark = new Graphics();
    checkmark.lineStyle(2, 0xFFFFFF, 0.8);
    checkmark.moveTo(width - 16, 12);
    checkmark.lineTo(width - 10, 18);
    checkmark.lineTo(width - 6, 8);
    checkmark.visible = false;
    container.addChild(checkmark);

    // Agent initial circle
    const avatarCircle = new Graphics();
    avatarCircle.beginFill(colors.accent);
    avatarCircle.drawCircle(40, 35, 24);
    avatarCircle.endFill();
    container.addChild(avatarCircle);

    // Agent initial letter
    const initialLabel = new Text(config.name.charAt(0), {
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
    });
    initialLabel.anchor.set(0.5);
    initialLabel.x = 40;
    initialLabel.y = 40;
    container.addChild(initialLabel);

    // Agent name
    const nameLabel = new Text(config.name, {
      fontSize: 14,
      fontWeight: 'bold',
      fill: 0x1E293B,
    });
    nameLabel.anchor.set(0, 0);
    nameLabel.x = 76;
    nameLabel.y = 28;
    container.addChild(nameLabel);

    // Agent role
    const roleLabel = new Text(config.role, {
      fontSize: 11,
      fill: 0x64748B,
    });
    roleLabel.x = 76;
    roleLabel.y = 46;
    container.addChild(roleLabel);

    // Status indicator
    const statusDot = new Graphics();
    statusDot.beginFill(this.getStatusColor('idle'));
    statusDot.drawCircle(76, 66, 6);
    statusDot.endFill();
    container.addChild(statusDot);

    // Status label
    const statusLabel = new Text(this.getStatusLabel('idle'), {
      fontSize: 11,
      fill: 0x64748B,
    });
    statusLabel.x = 88;
    statusLabel.y = 62;
    container.addChild(statusLabel);

    // Description
    const descLabel = new Text(config.description, {
      fontSize: 10,
      fill: 0x94A3B8,
      wordWrap: true,
      wordWrapWidth: width - 84,
    });
    descLabel.x = 76;
    descLabel.y = 84;
    container.addChild(descLabel);

    // Store references for updates
    const cardContainer = container as AgentCardContainer;
    cardContainer.agentCardData = {
      bg,
      selectionIndicator,
      checkmark,
      statusDot,
      statusLabel,
      agentType,
      isSelected: false,
      status: 'idle',
    };

    // Setup interactivity
    container.eventMode = 'static';
    container.cursor = 'pointer';

    container.on('pointerenter', () => {
      const cardContainer = container as AgentCardContainer;
      if (!cardContainer.agentCardData?.isSelected) {
        bg.alpha = 0.8;
      }
    });

    container.on('pointerleave', () => {
      const cardContainer = container as AgentCardContainer;
      if (!cardContainer.agentCardData?.isSelected) {
        bg.alpha = 0.5;
      }
    });

    container.on('pointerdown', () => {
      this.toggleAgent(agentType);
    });

    return container;
  }

  /**
   * Get agent-specific colors
   */
  private getAgentColors(agentType: AgentType): { bg: number; border: number; accent: number } {
    const colors: Record<AgentType, { bg: number; border: number; accent: number }> = {
      mentor: { bg: 0xF3E8FF, border: 0xC084FC, accent: 0x8B5CF6 },
      designer: { bg: 0xFFEDD5, border: 0xFDBA74, accent: 0xF97316 },
      analyst: { bg: 0xDBEAFE, border: 0x93C5FD, accent: 0x3B82F6 },
      marketer: { bg: 0xFCE7F3, border: 0xF9A8D4, accent: 0xEC4899 },
      assistant: { bg: 0xD1FAE5, border: 0x86EFAC, accent: 0x22C55E },
    };

    return colors[agentType];
  }

  /**
   * Get status color
   */
  private getStatusColor(status: AgentStatus): number {
    const colors: Record<AgentStatus, number> = {
      idle: 0x9CA3AF,
      thinking: 0xA855F7,
      speaking: 0x3B82F6,
      working: 0x22C55E,
    };

    return colors[status];
  }

  /**
   * Get status label
   */
  private getStatusLabel(status: AgentStatus): string {
    const labels: Record<AgentStatus, string> = {
      idle: '空闲',
      thinking: '思考中',
      speaking: '发言中',
      working: '工作中',
    };

    return labels[status];
  }

  /**
   * Setup panel interactivity
   */
  private setupInteractivity(): void {
    this.closeButton.eventMode = 'static';
    this.closeButton.cursor = 'pointer';
    this.closeButtonLabel.eventMode = 'static';

    const handleClose = (): void => {
      this.onClose?.();
    };

    this.closeButton.on('pointerup', handleClose);
    this.closeButtonLabel.on('pointerup', handleClose);
  }

  /**
   * Toggle agent selection
   */
  private toggleAgent(agentType: AgentType): void {
    const cardData = this.cards.get(agentType);
    if (!cardData) return;

    const wasSelected = cardData.isSelected;

    if (wasSelected) {
      // Deselect
      cardData.isSelected = false;
      this.selectedAgents = this.selectedAgents.filter((a) => a !== agentType);
      this.onAgentToggle?.(agentType, false);
    } else {
      // Select if not at max
      if (this.selectedAgents.length >= this.options.maxSelection) {
        return;
      }
      cardData.isSelected = true;
      this.selectedAgents.push(agentType);
      this.onAgentToggle?.(agentType, true);
    }

    // Update card visual
    this.updateCardVisual(agentType);
  }

  /**
   * Update card visual based on selection state
   */
  private updateCardVisual(agentType: AgentType): void {
    const cardData = this.cards.get(agentType);
    if (!cardData) return;

    // Find the card container
    this.cardsContainer.children.forEach((child) => {
      const cardContainer = child as AgentCardContainer;
      if (cardContainer.agentCardData?.agentType === agentType) {
        const cardDataRef = cardContainer.agentCardData;
        if (!cardDataRef) return;
        const { bg, selectionIndicator, checkmark } = cardDataRef;

        if (cardData.isSelected) {
          bg.alpha = 1;
          selectionIndicator.visible = true;
          checkmark.visible = true;
        } else {
          bg.alpha = 0.5;
          selectionIndicator.visible = false;
          checkmark.visible = false;
        }
      }
    });
  }

  /**
   * Update agent status
   */
  public updateAgentStatus(agentType: AgentType, status: AgentStatus): void {
    const cardData = this.cards.get(agentType);
    if (!cardData) return;

    cardData.status = status;

    // Update visual
    this.cardsContainer.children.forEach((child) => {
      const cardContainer = child as AgentCardContainer;
      if (cardContainer.agentCardData?.agentType === agentType) {
        const cardDataRef = cardContainer.agentCardData;
        if (!cardDataRef) return;
        const { statusDot, statusLabel } = cardDataRef;
        statusDot.clear();
        statusDot.beginFill(this.getStatusColor(status));
        statusDot.drawCircle(76, 66, 6);
        statusDot.endFill();
        statusLabel.text = this.getStatusLabel(status);
      }
    });
  }

  /**
   * Get selected agents
   */
  public getSelectedAgents(): AgentType[] {
    return [...this.selectedAgents];
  }

  /**
   * Clear all selections
   */
  public clearSelection(): void {
    this.selectedAgents.forEach((agentType) => {
      const cardData = this.cards.get(agentType);
      if (cardData) {
        cardData.isSelected = false;
        this.updateCardVisual(agentType);
      }
    });
    this.selectedAgents = [];
  }
}

export default AgentPanelPixi;
