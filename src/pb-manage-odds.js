import { LitElement, html, css } from 'lit-element';
import '@polymer/paper-dialog';
import '@polymer/paper-dialog-scrollable';
import '@polymer/iron-ajax';
import '@polymer/paper-checkbox';
import '@polymer/paper-button';
import '@polymer/paper-icon-button';
import '@polymer/paper-input/paper-input.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import { pbMixin } from './pb-mixin.js';
import './pb-restricted.js';
import './pb-ajax.js';
import './pb-edit-xml.js';

/**
 * High-level component implementing the ODD management panel
 * on the start page.
 *
 * @customElement
 * @polymer
 * @demo demo/pb-manage-odds.html
 * @appliesMixin pbMixin
 */
export class PbManageOdds extends pbMixin(LitElement) {
    static get properties() {
        return {
            /**
             * array of ODD-files to be listed
             */
            odds: {
                type: Array
            },
            target: {
                type: String
            },
            _valid: {
                type: Boolean
            },
            _current: {
                type: String
            },
            ...super.properties
        };
    }

    constructor() {
        super();
        this.odds = [];
    }

    firstUpdated() {
        super.firstUpdated();

        this._loader = this.shadowRoot.getElementById('load');
        this._form = this.shadowRoot.getElementById('ironform');
        this._form.addEventListener('change', () => {
            // Validate the entire form to see if we should enable the `Submit` button.
            this._valid = this._form.validate();
        });

        PbManageOdds.waitOnce('pb-page-ready', (options) => {
            this._loader.url = `${options.endpoint}/modules/lib/components-odd.xql`;
            this._refresh();
        });
    }

    _refresh(params) {
        this.emitTo('pb-start-update');

        this._loader.params = params;
        this._loader.generateRequest();
    }

    _update() {
        this.emitTo('pb-end-update');

        this.odds = this._loader.lastResponse;
    }

    _selectODD(ev) {
        const selected = ev.model.itemsIndex;
        this.odds.forEach((odd, index) => {
            if (index !== selected && odd.current) {
                this.set('odds.' + index + '.current', false);
                this.set('odds.' + selected + '.current', true);
            }
        });
        const params = { odd: ev.model.item.name + '.odd' };
        console.log('<pb-manage-odds> selected ODD: %o', params);

        this.emitTo('pb-load', {
            "params": params
        });
    }

    _createODD() {
        const params = this._form.serializeForm();
        console.log('<pb-manage-odds> create ODD: %o', params);
        this._refresh(params);
    }

    _createByExample() {
        const params = this._form.serializeForm();
        const fileBrowser = document.getElementById(this.target);
        if (!(fileBrowser || fileBrowser.getSelected)) {
            console.error('<pb-manage-odds> target %s not found', this.target);
        }
        const selected = fileBrowser.getSelected();
        document.querySelectorAll('.document-select paper-checkbox[checked]').forEach((checkbox) => {
            selected.push(checkbox.value);
        });
        console.log('<pb-manage-odds> create ODD by example: %o', selected);
        params['byExample'] = selected;
        this._refresh(params);
    }

    _delete(odd) {
        this._current = odd;
        this.shadowRoot.getElementById('deleteDialog').open();
    }

    _confirmDelete() {
        if (this._current) {
            console.log('<pb-manage-odds> deleting ODD: %s', this._current);
            this._refresh({ 'delete': this._current });
            this._current = null;
        } else {
            console.error('<pb-manage-odds> no file marked for deletion');
        }
    }

    render() {
        return html`
            ${this.odds.map((odd) =>
            html`
                <div class="odd">
                    <a href="odd-editor.html?odd=${odd.name}.odd" target="_blank">${odd.label}</a>
                    <!-- TODO this toolbar should only appear once per ODD files papercard -->
                    <app-toolbar>
                        <pb-restricted login="login">
                            <pb-ajax url="modules/lib/regenerate.xql?odd=${odd.name}.odd" dialog="messageDialog">
                                <paper-icon-button icon="update"></paper-icon-button>
                            </pb-ajax>
                            <paper-icon-button icon="delete" @click="${() => this._delete(odd.path)}"></paper-icon-button>
                        </pb-restricted>
                        <pb-edit-xml path="${odd.path}">
                            <paper-icon-button icon="code"></paper-icon-button>
                        </pb-edit-xml>
                    </app-toolbar>
                </div>
                <div class="odd-description">${odd.description}</div>
            `)}
            <pb-restricted login="login">
                <iron-form id="ironform">
                    <form>
                        <paper-input name="new_odd" label="File name of the ODD (without suffix)" required auto-validate pattern="[a-zA-Z0-9-_]+"></paper-input>
                        <paper-input name="title" label="Title for display" auto-validate required></paper-input>
                        <paper-button .disabled="${!this._valid}" id="createBtn" @click="${this._createODD}"><iron-icon icon="create"></iron-icon>Create</paper-button>
                        <paper-button .disabled="${!this._valid}" id="createByEx" @click="${this._createByExample}"><iron-icon icon="build"></iron-icon>Create from examples</paper-button>
                    </form>
                </iron-form>
            </pb-restricted>

            <iron-ajax
                id="load"
                verbose
                handle-as="json"
                method="get"
                @response="${this._update}"></iron-ajax>

            <paper-dialog id="deleteDialog">
                <h2>Delete</h2>
                <paper-dialog-scrollable>
                    <p>Are you sure you want to delete the ODD file ${this.file}?</p>
                </paper-dialog-scrollable>
                <div class="buttons">
                    <paper-button dialog-confirm="dialog-confirm" autofocus @click="${this._confirmDelete}">Yes</paper-button>
                    <paper-button dialog-confirm="dialog-cancel">no</paper-button>
                </div>
            </paper-dialog>
        `;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }

            .odd {
                display: flex;
                flex-direction: row;
                align-items: center;
            }

            .odd paper-checkbox {
                display: block;
                flex: 0 0;
                margin-right: 1em;
            }

            .odd a {
                display: block;
                flex: 2 0;
            }

            .odd app-toolbar {
                flex: 1 0;
            }

            pb-restricted {
                display: flex;
            }

            .odd-description {
                color: #888888;
                font-size: 0.8em;
                margin-top: -1em;
            }
        `;
    }
}
customElements.define('pb-manage-odds', PbManageOdds);