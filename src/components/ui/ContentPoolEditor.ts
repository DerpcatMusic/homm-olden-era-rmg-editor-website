// Content pool editor component
// This class handles creation and editing of content pools

import { EventBus } from '../../store/EventBus';
import { StateManager } from '../../store/StateManager';
import { GameDataService } from '../../services/GameDataService';
import { ContentPoolConfig, ContentWeight, ContentID } from '../../models/types';

export class ContentPoolEditor {
    private eventBus: EventBus;
    private stateManager: StateManager;
    private gameDataService: GameDataService;
    private container: HTMLElement;
    private currentPoolIndex: number = -1;

    constructor(container: HTMLElement, eventBus: EventBus, stateManager: StateManager, gameDataService: GameDataService) {
        this.container = container;
        this.eventBus = eventBus;
        this.stateManager = stateManager;
        this.gameDataService = gameDataService;
        this.initialize();
        this.setupEventHandlers();
    }

    private initialize(): void {
        this.container.innerHTML = `
            <div class="content-pool-editor">
                <div class="pool-list">
                    <h3>Content Pools</h3>
                    <div class="pool-items"></div>
                    <button class="add-pool-btn">Add Pool</button>
                </div>
                <div class="pool-details">
                    <h3>Pool Details</h3>
                    <div class="pool-form"></div>
                </div>
            </div>
        `;
    }

    private setupEventHandlers(): void {
        const addPoolBtn = this.container.querySelector('.add-pool-btn') as HTMLButtonElement;
        addPoolBtn.addEventListener('click', () => this.addNewPool());

        this.eventBus.on('content-pool:selected', (data) => {
            this.selectPool(data.poolIndex);
        });

        this.eventBus.on('content-pool:updated', () => {
            this.refreshPoolList();
        });
    }

    private addNewPool(): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return;

        const newPool: ContentPoolConfig = {
            name: `content_pool_${template.contentPools.length + 1}`,
            valueDistribution: {
                priceBounds: [],
                weights: [1]
            },
            groups: [],
            bans: []
        };

        template.contentPools.push(newPool);
        this.stateManager.markDirty();
        this.refreshPoolList();
        this.selectPool(template.contentPools.length - 1);
        this.eventBus.emit('content-pool:created', { poolIndex: template.contentPools.length - 1 });
    }

    private selectPool(poolIndex: number): void {
        this.currentPoolIndex = poolIndex;
        this.renderPoolDetails();
    }

    private refreshPoolList(): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return;

        const poolItems = this.container.querySelector('.pool-items') as HTMLElement;
        poolItems.innerHTML = template.contentPools.map((pool, index) => `
            <div class="pool-item ${index === this.currentPoolIndex ? 'active' : ''}" data-pool-index="${index}">
                <span class="pool-name">${pool.name}</span>
                <span class="pool-groups">${pool.groups.length} groups</span>
            </div>
        `).join('');

        // Add click handlers
        const items = poolItems.querySelectorAll('.pool-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                const index = parseInt((e.currentTarget as HTMLElement).dataset.poolIndex!);
                this.selectPool(index);
            });
        });
    }

    private renderPoolDetails(): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template || this.currentPoolIndex < 0) {
            this.container.querySelector('.pool-form')!.innerHTML = '<p>Select a pool to edit</p>';
            return;
        }

        const pool = template.contentPools[this.currentPoolIndex];
        const formHtml = `
            <div class="form-group">
                <label for="pool-name">Pool Name:</label>
                <input type="text" id="pool-name" value="${pool.name}" />
            </div>
            <div class="value-distribution">
                <h4>Value Distribution</h4>
                <div class="distribution-config">
                    <div class="form-group">
                        <label>Price Bounds (comma-separated):</label>
                        <input type="text" id="price-bounds" value="${pool.valueDistribution.priceBounds.join(', ')}" />
                    </div>
                    <div class="form-group">
                        <label>Weights (comma-separated):</label>
                        <input type="text" id="weights" value="${pool.valueDistribution.weights.join(', ')}" />
                    </div>
                </div>
            </div>
            <div class="pool-groups">
                <h4>Content Groups</h4>
                <div class="groups-list">
                    ${pool.groups.map((group, groupIndex) => `
                        <div class="group-item" data-group-index="${groupIndex}">
                            <div class="group-header">
                                <span>Group ${groupIndex + 1} (Weight: ${group.weight})</span>
                                <button class="remove-group-btn" data-group-index="${groupIndex}">Remove</button>
                            </div>
                            <div class="group-content">
                                <div class="form-group">
                                    <label>Include Lists:</label>
                                    <input type="text" class="include-lists" data-group-index="${groupIndex}" value="${group.includeLists.join(', ')}" />
                                </div>
                                <div class="content-weights">
                                    <h5>Content Weights</h5>
                                    <div class="weights-list" data-group-index="${groupIndex}">
                                        ${group.content.map((weight, weightIndex) => `
                                            <div class="weight-item">
                                                <input type="text" class="content-sid" placeholder="SID" value="${weight.sid || ''}" data-group="${groupIndex}" data-weight="${weightIndex}" />
                                                <input type="number" class="content-weight" placeholder="Weight" value="${weight.weight}" data-group="${groupIndex}" data-weight="${weightIndex}" />
                                                <button class="remove-weight-btn" data-group="${groupIndex}" data-weight="${weightIndex}">Remove</button>
                                            </div>
                                        `).join('')}
                                        <button class="add-weight-btn" data-group="${groupIndex}">Add Content</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="add-group-btn">Add Group</button>
            </div>
            <div class="pool-bans">
                <h4>Banned Content</h4>
                <div class="bans-list">
                    ${pool.bans.map((ban, banIndex) => `
                        <div class="ban-item">
                            <input type="text" class="ban-sid" placeholder="SID" value="${ban.sid || ''}" data-ban="${banIndex}" />
                            <input type="number" class="ban-variant" placeholder="Variant" value="${ban.variant}" data-ban="${banIndex}" />
                            <button class="remove-ban-btn" data-ban="${banIndex}">Remove</button>
                        </div>
                    `).join('')}
                </div>
                <button class="add-ban-btn">Add Ban</button>
            </div>
        `;

        this.container.querySelector('.pool-form')!.innerHTML = formHtml;
        this.setupFormEventHandlers();
    }

    private setupFormEventHandlers(): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template || this.currentPoolIndex < 0) return;

        const pool = template.contentPools[this.currentPoolIndex];

        // Pool name
        const nameInput = this.container.querySelector('#pool-name') as HTMLInputElement;
        nameInput.addEventListener('input', (e) => {
            pool.name = (e.target as HTMLInputElement).value;
            this.stateManager.markDirty();
            this.refreshPoolList();
        });

        // Value distribution
        const priceBoundsInput = this.container.querySelector('#price-bounds') as HTMLInputElement;
        priceBoundsInput.addEventListener('input', (e) => {
            const values = (e.target as HTMLInputElement).value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
            pool.valueDistribution.priceBounds = values;
            this.stateManager.markDirty();
        });

        const weightsInput = this.container.querySelector('#weights') as HTMLInputElement;
        weightsInput.addEventListener('input', (e) => {
            const values = (e.target as HTMLInputElement).value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
            pool.valueDistribution.weights = values;
            this.stateManager.markDirty();
        });

        // Add group button
        const addGroupBtn = this.container.querySelector('.add-group-btn') as HTMLButtonElement;
        addGroupBtn.addEventListener('click', () => {
            pool.groups.push({
                weight: 1,
                includeLists: [],
                content: []
            });
            this.stateManager.markDirty();
            this.renderPoolDetails();
        });

        // Add weight buttons
        const addWeightBtns = this.container.querySelectorAll('.add-weight-btn');
        addWeightBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const groupIndex = parseInt((e.target as HTMLElement).dataset.group!);
                pool.groups[groupIndex].content.push({
                    sid: '',
                    weight: 1
                });
                this.stateManager.markDirty();
                this.renderPoolDetails();
            });
        });

        // Remove group buttons
        const removeGroupBtns = this.container.querySelectorAll('.remove-group-btn');
        removeGroupBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const groupIndex = parseInt((e.target as HTMLElement).dataset.groupIndex!);
                pool.groups.splice(groupIndex, 1);
                this.stateManager.markDirty();
                this.renderPoolDetails();
            });
        });

        // Remove weight buttons
        const removeWeightBtns = this.container.querySelectorAll('.remove-weight-btn');
        removeWeightBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const groupIndex = parseInt((e.target as HTMLElement).dataset.group!);
                const weightIndex = parseInt((e.target as HTMLElement).dataset.weight!);
                pool.groups[groupIndex].content.splice(weightIndex, 1);
                this.stateManager.markDirty();
                this.renderPoolDetails();
            });
        });

        // Content weight inputs
        const contentSids = this.container.querySelectorAll('.content-sid');
        contentSids.forEach(input => {
            input.addEventListener('input', (e) => {
                const groupIndex = parseInt((e.target as HTMLElement).dataset.group!);
                const weightIndex = parseInt((e.target as HTMLElement).dataset.weight!);
                pool.groups[groupIndex].content[weightIndex].sid = (e.target as HTMLInputElement).value;
                this.stateManager.markDirty();
            });
        });

        const contentWeights = this.container.querySelectorAll('.content-weight');
        contentWeights.forEach(input => {
            input.addEventListener('input', (e) => {
                const groupIndex = parseInt((e.target as HTMLElement).dataset.group!);
                const weightIndex = parseInt((e.target as HTMLElement).dataset.weight!);
                pool.groups[groupIndex].content[weightIndex].weight = parseFloat((e.target as HTMLInputElement).value) || 1;
                this.stateManager.markDirty();
            });
        });

        // Include lists inputs
        const includeListsInputs = this.container.querySelectorAll('.include-lists');
        includeListsInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const groupIndex = parseInt((e.target as HTMLElement).dataset.groupIndex!);
                const lists = (e.target as HTMLInputElement).value.split(',').map(s => s.trim()).filter(s => s);
                pool.groups[groupIndex].includeLists = lists;
                this.stateManager.markDirty();
            });
        });

        // Add ban button
        const addBanBtn = this.container.querySelector('.add-ban-btn') as HTMLButtonElement;
        addBanBtn.addEventListener('click', () => {
            pool.bans.push({
                sid: '',
                variant: -1
            });
            this.stateManager.markDirty();
            this.renderPoolDetails();
        });

        // Remove ban buttons
        const removeBanBtns = this.container.querySelectorAll('.remove-ban-btn');
        removeBanBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const banIndex = parseInt((e.target as HTMLElement).dataset.ban!);
                pool.bans.splice(banIndex, 1);
                this.stateManager.markDirty();
                this.renderPoolDetails();
            });
        });

        // Ban inputs
        const banSids = this.container.querySelectorAll('.ban-sid');
        banSids.forEach(input => {
            input.addEventListener('input', (e) => {
                const banIndex = parseInt((e.target as HTMLElement).dataset.ban!);
                pool.bans[banIndex].sid = (e.target as HTMLInputElement).value;
                this.stateManager.markDirty();
            });
        });

        const banVariants = this.container.querySelectorAll('.ban-variant');
        banVariants.forEach(input => {
            input.addEventListener('input', (e) => {
                const banIndex = parseInt((e.target as HTMLElement).dataset.ban!);
                pool.bans[banIndex].variant = parseInt((e.target as HTMLInputElement).value) || -1;
                this.stateManager.markDirty();
            });
        });
    }

    public refresh(): void {
        this.refreshPoolList();
        if (this.currentPoolIndex >= 0) {
            this.renderPoolDetails();
        }
    }
}