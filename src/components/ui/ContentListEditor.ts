// Content list editor component
// This class handles creation and editing of content lists

import { EventBus } from '../../store/EventBus';
import { StateManager } from '../../store/StateManager';
import { GameDataService } from '../../services/GameDataService';
import { ContentList, ContentWeight } from '../../models/types';

export class ContentListEditor {
    private eventBus: EventBus;
    private stateManager: StateManager;
    private gameDataService: GameDataService;
    private container: HTMLElement;
    private currentListIndex: number = -1;

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
            <div class="content-list-editor">
                <div class="list-list">
                    <h3>Content Lists</h3>
                    <div class="list-items"></div>
                    <button class="add-list-btn">Add List</button>
                </div>
                <div class="list-details">
                    <h3>List Details</h3>
                    <div class="list-form"></div>
                </div>
            </div>
        `;
    }

    private setupEventHandlers(): void {
        const addListBtn = this.container.querySelector('.add-list-btn') as HTMLButtonElement;
        addListBtn.addEventListener('click', () => this.addNewList());

        this.eventBus.on('content-list:selected', (data) => {
            this.selectList(data.listIndex);
        });

        this.eventBus.on('content-list:updated', () => {
            this.refreshListList();
        });
    }

    private addNewList(): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return;

        const newList: ContentList = {
            name: `content_list_${template.contentLists.length + 1}`,
            content: []
        };

        template.contentLists.push(newList);
        this.stateManager.markDirty();
        this.refreshListList();
        this.selectList(template.contentLists.length - 1);
        this.eventBus.emit('content-list:created', { listIndex: template.contentLists.length - 1 });
    }

    private selectList(listIndex: number): void {
        this.currentListIndex = listIndex;
        this.renderListDetails();
    }

    private refreshListList(): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template) return;

        const listItems = this.container.querySelector('.list-items') as HTMLElement;
        listItems.innerHTML = template.contentLists.map((list, index) => `
            <div class="list-item ${index === this.currentListIndex ? 'active' : ''}" data-list-index="${index}">
                <span class="list-name">${list.name}</span>
                <span class="list-content">${list.content.length} items</span>
            </div>
        `).join('');

        // Add click handlers
        const items = listItems.querySelectorAll('.list-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                const index = parseInt((e.currentTarget as HTMLElement).dataset.listIndex!);
                this.selectList(index);
            });
        });
    }

    private renderListDetails(): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template || this.currentListIndex < 0) {
            this.container.querySelector('.list-form')!.innerHTML = '<p>Select a list to edit</p>';
            return;
        }

        const list = template.contentLists[this.currentListIndex];
        const formHtml = `
            <div class="form-group">
                <label for="list-name">List Name:</label>
                <input type="text" id="list-name" value="${list.name}" />
            </div>
            <div class="content-items">
                <h4>Content Items</h4>
                <div class="items-list">
                    ${list.content.map((item, itemIndex) => `
                        <div class="content-item">
                            <input type="text" class="item-sid" placeholder="SID" value="${item.sid || ''}" data-item="${itemIndex}" />
                            <input type="number" class="item-variant" placeholder="Variant" value="${item.variant || -1}" data-item="${itemIndex}" />
                            <input type="text" class="item-biome" placeholder="Biome" value="${item.biome || ''}" data-item="${itemIndex}" />
                            <input type="number" class="item-weight" placeholder="Weight" value="${item.weight}" data-item="${itemIndex}" />
                            <button class="remove-item-btn" data-item="${itemIndex}">Remove</button>
                        </div>
                    `).join('')}
                </div>
                <button class="add-item-btn">Add Content Item</button>
            </div>
        `;

        this.container.querySelector('.list-form')!.innerHTML = formHtml;
        this.setupFormEventHandlers();
    }

    private setupFormEventHandlers(): void {
        const template = this.stateManager.getCurrentTemplate();
        if (!template || this.currentListIndex < 0) return;

        const list = template.contentLists[this.currentListIndex];

        // List name
        const nameInput = this.container.querySelector('#list-name') as HTMLInputElement;
        nameInput.addEventListener('input', (e) => {
            list.name = (e.target as HTMLInputElement).value;
            this.stateManager.markDirty();
            this.refreshListList();
        });

        // Add item button
        const addItemBtn = this.container.querySelector('.add-item-btn') as HTMLButtonElement;
        addItemBtn.addEventListener('click', () => {
            list.content.push({
                sid: '',
                variant: -1,
                weight: 1
            });
            this.stateManager.markDirty();
            this.renderListDetails();
        });

        // Remove item buttons
        const removeItemBtns = this.container.querySelectorAll('.remove-item-btn');
        removeItemBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemIndex = parseInt((e.target as HTMLElement).dataset.item!);
                list.content.splice(itemIndex, 1);
                this.stateManager.markDirty();
                this.renderListDetails();
            });
        });

        // Item inputs
        const itemSids = this.container.querySelectorAll('.item-sid');
        itemSids.forEach(input => {
            input.addEventListener('input', (e) => {
                const itemIndex = parseInt((e.target as HTMLElement).dataset.item!);
                list.content[itemIndex].sid = (e.target as HTMLInputElement).value;
                this.stateManager.markDirty();
            });
        });

        const itemVariants = this.container.querySelectorAll('.item-variant');
        itemVariants.forEach(input => {
            input.addEventListener('input', (e) => {
                const itemIndex = parseInt((e.target as HTMLElement).dataset.item!);
                list.content[itemIndex].variant = parseInt((e.target as HTMLInputElement).value) || -1;
                this.stateManager.markDirty();
            });
        });

        const itemBiomes = this.container.querySelectorAll('.item-biome');
        itemBiomes.forEach(input => {
            input.addEventListener('input', (e) => {
                const itemIndex = parseInt((e.target as HTMLElement).dataset.item!);
                list.content[itemIndex].biome = (e.target as HTMLInputElement).value || undefined;
                this.stateManager.markDirty();
            });
        });

        const itemWeights = this.container.querySelectorAll('.item-weight');
        itemWeights.forEach(input => {
            input.addEventListener('input', (e) => {
                const itemIndex = parseInt((e.target as HTMLElement).dataset.item!);
                list.content[itemIndex].weight = parseFloat((e.target as HTMLInputElement).value) || 1;
                this.stateManager.markDirty();
            });
        });
    }

    public refresh(): void {
        this.refreshListList();
        if (this.currentListIndex >= 0) {
            this.renderListDetails();
        }
    }
}