// Content selection dialogs
// This class handles content browsing and selection for RMG templates

import { GameDataService } from '../../services/GameDataService';
import { Content } from '../../services/GameDataService';

export class ContentBrowser {
    private dialog!: HTMLDialogElement;
    private selectedContent: any[] = [];
    private gameDataService: GameDataService;
    private contentType: 'units' | 'heroes' | 'artifacts' | 'all' = 'all';

    constructor(gameDataService: GameDataService) {
        this.gameDataService = gameDataService;
        this.createDialog();
        this.setupEventHandlers();
    }

    private createDialog(): void {
        // TODO: Create modal dialog HTML structure
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'content-browser-dialog';
        this.dialog.innerHTML = `
            <div class="dialog-header">
                <h2>Content Browser</h2>
                <button class="close-button">&times;</button>
            </div>
            <div class="dialog-content">
                <div class="content-filters">
                    <input type="text" placeholder="Search content..." class="search-input">
                    <select class="content-type-filter">
                        <option value="all">All Types</option>
                        <option value="buildings">Buildings</option>
                        <option value="creatures">Creatures</option>
                        <option value="resources">Resources</option>
                        <option value="artifacts">Artifacts</option>
                    </select>
                </div>
                <div class="content-list">
                    <!-- Content items will be displayed here -->
                </div>
            </div>
            <div class="dialog-footer">
                <button class="cancel-button">Cancel</button>
                <button class="select-button">Select Content</button>
            </div>
        `;
        document.body.appendChild(this.dialog);
    }

    private setupEventHandlers(): void {
        // TODO: Setup dialog event handlers
        const closeButton = this.dialog.querySelector('.close-button') as HTMLElement;
        const cancelButton = this.dialog.querySelector('.cancel-button') as HTMLElement;
        const selectButton = this.dialog.querySelector('.select-button') as HTMLElement;
        const searchInput = this.dialog.querySelector('.search-input') as HTMLInputElement;
        const typeFilter = this.dialog.querySelector('.content-type-filter') as HTMLSelectElement;

        closeButton.addEventListener('click', () => this.close());
        cancelButton.addEventListener('click', () => this.close());
        selectButton.addEventListener('click', () => this.selectContent());

        searchInput.addEventListener('input', () => this.filterContent());
        typeFilter.addEventListener('change', () => this.filterContent());
    }

    public show(contentType: 'units' | 'heroes' | 'artifacts' | 'all' = 'all'): void {
        this.contentType = contentType;
        this.loadContent();
        this.dialog.showModal();
    }

    public close(): void {
        this.dialog.close();
        this.selectedContent = [];
    }

    private loadContent(): void {
        const contentList = this.dialog.querySelector('.content-list') as HTMLElement;
        contentList.innerHTML = '<p>Loading content...</p>';

        // Fetch content from game data service based on type
        let content: Content[] = [];
        switch (this.contentType) {
            case 'units':
                content = this.gameDataService.getUnits();
                break;
            case 'heroes':
                content = this.gameDataService.getHeroes();
                break;
            case 'artifacts':
                content = this.gameDataService.getArtifacts();
                break;
            case 'all':
            default:
                content = this.gameDataService.searchContent('');
                break;
        }

        this.displayContent(content);
    }

    private displayContent(content: Content[]): void {
        const contentList = this.dialog.querySelector('.content-list') as HTMLElement;
        contentList.innerHTML = '';

        if (content.length === 0) {
            contentList.innerHTML = '<p>No content available</p>';
            return;
        }

        content.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'content-item';
            itemElement.dataset.id = item.id;
            itemElement.innerHTML = `
                <input type="checkbox" class="content-checkbox">
                <span class="content-name">${item.name}</span>
                <span class="content-type">${item.type}</span>
                <span class="content-id">${item.id}</span>
            `;

            itemElement.addEventListener('click', (e) => {
                if (e.target !== itemElement.querySelector('.content-checkbox')) {
                    const checkbox = itemElement.querySelector('.content-checkbox') as HTMLInputElement;
                    checkbox.checked = !checkbox.checked;
                    this.updateSelection();
                }
            });

            contentList.appendChild(itemElement);
        });
    }

    private filterContent(): void {
        const searchInput = this.dialog.querySelector('.search-input') as HTMLInputElement;
        const typeFilter = this.dialog.querySelector('.content-type-filter') as HTMLSelectElement;

        const searchTerm = searchInput.value.toLowerCase();
        const typeFilterValue = typeFilter.value;

        // Get current content based on type
        let content: Content[] = [];
        switch (this.contentType) {
            case 'units':
                content = this.gameDataService.getUnits();
                break;
            case 'heroes':
                content = this.gameDataService.getHeroes();
                break;
            case 'artifacts':
                content = this.gameDataService.getArtifacts();
                break;
            case 'all':
            default:
                content = this.gameDataService.searchContent('');
                break;
        }

        // Apply filters
        let filteredContent = content;
        if (searchTerm) {
            filteredContent = filteredContent.filter(item =>
                item.name.toLowerCase().includes(searchTerm) ||
                item.id.toLowerCase().includes(searchTerm)
            );
        }

        if (typeFilterValue !== 'all') {
            filteredContent = filteredContent.filter(item => item.type === typeFilterValue);
        }

        this.displayContent(filteredContent);
    }

    private updateSelection(): void {
        // TODO: Update selected content array based on checked items
        const checkboxes = this.dialog.querySelectorAll('.content-checkbox:checked') as NodeListOf<HTMLInputElement>;
        this.selectedContent = Array.from(checkboxes).map(cb => {
            const itemElement = cb.closest('.content-item') as HTMLElement;
            return { id: itemElement.dataset.id };
        });
    }

    private selectContent(): void {
        // TODO: Emit selection event or callback with selected content
        console.log('Selected content:', this.selectedContent);
        this.close();
    }
}