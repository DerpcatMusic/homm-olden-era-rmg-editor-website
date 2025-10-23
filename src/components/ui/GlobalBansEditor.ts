// Global bans editor component
// This class handles editing of global bans for templates

import { EventBus } from '../../store/EventBus';
import { StateManager } from '../../store/StateManager';
import { GameDataService } from '../../services/GameDataService';

export class GlobalBansEditor {
    private eventBus: EventBus;
    private stateManager: StateManager;
    private gameDataService: GameDataService;
    private container: HTMLElement;

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
            <div class="global-bans-editor">
                <h3>Global Bans</h3>
                <div class="bans-sections">
                    <div class="ban-section">
                        <h4>Magic Bans</h4>
                        <div class="ban-list" data-type="magics">
                            <div class="ban-items"></div>
                            <button class="add-ban-btn" data-type="magics">Add Magic Ban</button>
                        </div>
                    </div>
                    <div class="ban-section">
                        <h4>Item Bans</h4>
                        <div class="ban-list" data-type="items">
                            <div class="ban-items"></div>
                            <button class="add-ban-btn" data-type="items">Add Item Ban</button>
                        </div>
                    </div>
                    <div class="ban-section">
                        <h4>Skill Bans</h4>
                        <div class="ban-list" data-type="skills">
                            <div class="ban-items"></div>
                            <button class="add-ban-btn" data-type="skills">Add Skill Ban</button>
                        </div>
                    </div>
                    <div class="ban-section">
                        <h4>Hero Bans</h4>
                        <div class="ban-list" data-type="heroes">
                            <div class="ban-items"></div>
                            <button class="add-ban-btn" data-type="heroes">Add Hero Ban</button>
                        </div>
                    </div>
                    <div class="ban-section">
                        <h4>Unit Bans</h4>
                        <div class="ban-list" data-type="units">
                            <div class="ban-items"></div>
                            <button class="add-ban-btn" data-type="units">Add Unit Ban</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private setupEventHandlers(): void {
        const addBanBtns = this.container.querySelectorAll('.add-ban-btn');
        addBanBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = (e.target as HTMLElement).dataset.type!;
                this.addBan(type);
            });
        });

        this.eventBus.on('global-bans:updated', () => {
            this.refreshBans();
        });
    }

    private addBan(type: keyof GlobalBans): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return;

        if (!template.globalBans[type]) {
            template.globalBans[type] = [];
        }

        template.globalBans[type].push('');
        this.stateManager.markDirty();
        this.refreshBans();
    }

    private removeBan(type: keyof GlobalBans, index: number): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return;

        if (template.globalBans[type] && template.globalBans[type][index] !== undefined) {
            template.globalBans[type].splice(index, 1);
            this.stateManager.markDirty();
            this.refreshBans();
        }
    }

    private updateBan(type: keyof GlobalBans, index: number, value: string): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return;

        if (template.globalBans[type] && template.globalBans[type][index] !== undefined) {
            template.globalBans[type][index] = value;
            this.stateManager.markDirty();
        }
    }

    private refreshBans(): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return;

        const banTypes: (keyof GlobalBans)[] = ['magics', 'items', 'skills', 'heroes', 'units'];

        banTypes.forEach(type => {
            const banList = this.container.querySelector(`.ban-list[data-type="${type}"] .ban-items`) as HTMLElement;
            const bans = template.globalBans[type] || [];

            banList.innerHTML = bans.map((ban, index) => `
                <div class="ban-item">
                    <input type="text" class="ban-input" data-type="${type}" data-index="${index}" value="${ban}" placeholder="Enter ${type.slice(0, -1)} ID" />
                    <button class="remove-ban-btn" data-type="${type}" data-index="${index}">Remove</button>
                </div>
            `).join('');

            // Add event handlers for this type
            const inputs = banList.querySelectorAll('.ban-input');
            inputs.forEach(input => {
                input.addEventListener('input', (e) => {
                    const target = e.target as HTMLElement;
                    const banType = target.dataset.type as keyof GlobalBans;
                    const banIndex = parseInt(target.dataset.index!);
                    this.updateBan(banType, banIndex, (e.target as HTMLInputElement).value);
                });
            });

            const removeBtns = banList.querySelectorAll('.remove-ban-btn');
            removeBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const target = e.target as HTMLElement;
                    const banType = target.dataset.type as keyof GlobalBans;
                    const banIndex = parseInt(target.dataset.index!);
                    this.removeBan(banType, banIndex);
                });
            });
        });
    }

    public refresh(): void {
        this.refreshBans();
    }
}

// Type for global bans
interface GlobalBans {
    magics: string[];
    items: string[];
    skills: string[];
    heroes: string[];
    units: string[];
}