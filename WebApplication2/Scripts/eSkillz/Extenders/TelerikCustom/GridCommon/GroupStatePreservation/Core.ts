/// <reference path="../../../../../typings/app_shared.d.ts" />
/// <reference path="../../../../../typings/telerik/telerik.web.ui.d.ts" />
/// <reference path="../../../../../typings/microsoft-ajax/microsoft.ajax.d.ts" />
/// <reference path="../../../../../typings/jquery/jquery.d.ts" />

module eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation {
	const enum SaveRestoreModes {
		Save = 1,
		Restore = 2
	}
	export interface IGroupData {
		key: string;
		level: number;
		fieldName: string;
	}
	export interface ISaveScrollPositionData {
		$ScrollElement: JQuery;
		PageIndex: number;
	}
	export class GridOptionsCommon {
		constructor(
			public GridClientId: string,
			public AddEventHandlers: boolean,
			public SaveGridScrollPosition: boolean,
			public GridContainerSelector: string
		) { }
	}
	class ToggleButtonState {
		constructor(
			public IsExpanded: boolean,
			public ButtonElement: JQuery) {
		}
	}
	class GroupState {
		public ParentGroupText: string = "";
		constructor(
			public GroupData: IGroupData,
			public ToggleButtonState: ToggleButtonState) {

		}
		FullGroupText(): string {
			return this.ParentGroupText + "/" + this.GroupData.key;
		}
	}

	export enum GroupToggleActions {
		None = 0,
		Collapse = 1,
		Expand = 2
	}

	export type GetGroupDataByRowDelegateType = ($groupHeaderElement: JQuery) => IGroupData;
	export type ToggleGroupByRowDelegateType = ($groupHeaderElement: JQuery, toggleAction: GroupToggleActions) => void;

	export type GroupHeaderElementChildType = HTMLTableCellElement;

	export class Setup {
		constructor(
			public GridOptions: GridOptionsCommon,
			public GetGridTableElement: () => JQuery,
			public GroupHeaderElementSelector: string,
			public GroupHeaderChildren_ToggleElementSelector: string,
			public GroupHeaderChildren_ToggleElementSelectorFilter: string,
			public GroupHeaderChildren_TextElementSelector: string,
			public GroupHeaderChildren_TextElementSelectorFilter: string,
			public GroupToggleElementExpandCssClass: string,
			public GroupToggleElementCollapseCssClass: string,
			public GetGroupKeyByRow: GetGroupDataByRowDelegateType,
			public GetSaveScrollPositionData: () => ISaveScrollPositionData,
			public ToggleGroupByRow: ToggleGroupByRowDelegateType = null) {
		}

		//#region Toggle Elements
		get_ExpandToggleElementSelector(): string {
			return this.GroupHeaderElementSelector
				+ " " + this.GroupHeaderChildren_ToggleElementSelector
				+ "." + this.GroupToggleElementExpandCssClass;
		}
		get_CollapseToggleElementSelector(): string {
			return this.GroupHeaderElementSelector
				+ " " + this.GroupHeaderChildren_ToggleElementSelector
				+ "." + this.GroupToggleElementCollapseCssClass;
		}
		get_ExpandAndCollapseToggleElementsSelector(): string {
			return this.get_ExpandToggleElementSelector() + ", " + this.get_CollapseToggleElementSelector();
		}
		//#endregion

		//#region Text Elements
		get_TextElementSelector(): string {
			var selector = this.GroupHeaderElementSelector
				+ " " + this.GroupHeaderChildren_TextElementSelector;
			return selector;
		}
		//#endregion
	}

	export class Core {
		constructor(private setup: Setup) { }

		get_Setup() {
			return this.setup;
		}

		//#region Selectors
		private $tableElement: JQuery;
		private _set_$TableElement($element: JQuery): void {
			this.$tableElement = $element;
		}
		private _get_$GroupHeaderElements(): JQuery {
			if (!this.$tableElement || this.$tableElement.length === 0) { return null; }
			return this.$tableElement.find(this.setup.GroupHeaderElementSelector);
		}
		private _get_$GroupHeaderChildElements(selector: string, selectorFilter?: string): JQuery {
			var $elements = this._get_$GroupHeaderElements().find(selector);
			if (selectorFilter && selectorFilter !== "") {
				return $elements.filter(selectorFilter);
			} else {
				return $elements;
			}
		}
		private _get_$GroupHeaderChildElementWithinHeader(
			$groupHeaderElement: JQuery, selector: string, selectorFilter?: string): JQuery {
			var $element = $groupHeaderElement.find(selector);
			if (selectorFilter && selectorFilter !== "") {
				return $element.filter(selectorFilter);
			} else {
				return $element;
			}
		}

		//#region Expand/Collapse Elements
		private _get_$groupToggleElementsAll(): JQuery {
			return this._get_$GroupHeaderChildElements(
				this.setup.GroupHeaderChildren_ToggleElementSelector,
				this.setup.GroupHeaderChildren_ToggleElementSelectorFilter);
		}

		private _get_$groupToggleElementInHeader($groupHeaderElement: JQuery): JQuery {
			return this._get_$GroupHeaderChildElementWithinHeader(
				$groupHeaderElement,
				this.setup.GroupHeaderChildren_ToggleElementSelector,
				this.setup.GroupHeaderChildren_ToggleElementSelectorFilter);
		}
		//#endregion

		//#region Text Elements
		private _get_$GroupTextElementsAll(): JQuery {
			return this._get_$GroupHeaderChildElements(
				this.setup.GroupHeaderChildren_TextElementSelector,
				this.setup.GroupHeaderChildren_TextElementSelectorFilter);
		}
		//#endregion

		//#endregion

		//#region Group Expanded/Collapsed State Tracking
		private groupsExpanded: Array<string> = [];
		private groupsCollapsed: Array<string> = [];

		private _GroupItem_Add(list: Array<string>, value: string) {
			if (list.indexOf(value) === -1) {
				list.push(value);
			}
		}
		private _GroupItem_Remove(list: Array<string>, value: string) {
			var itemIndex = list.indexOf(value);
			if (itemIndex > -1) {
				list.splice(itemIndex, 1);
			}
		}

		//#region Pause Processing
		private pauseGroupStateChangeEventHandlers = false;
		set_pauseGroupStateChangeEventHandlers(value: boolean): void {
			this.pauseGroupStateChangeEventHandlers = value;
		}
		get_pauseGroupStateChangeEventHandlers(): boolean {
			return this.pauseGroupStateChangeEventHandlers;
		}
		//#endregion

		//#region Helpers

		//#region Common
		private lastGroupLevel: number;
		private lastGroupKey: string;
		private groupLevelRootValue: number;
		private currentTopLevelGroupName: string = null;
		private currentParentGroupPathArray: Array<string> = [];
		private _BeginSaveRestore() {
			this.lastGroupLevel = -1;
			this.lastGroupKey = "";
			this.groupLevelRootValue = -1;
			this.currentParentGroupPathArray.length = 0;
		}
		private _get_GroupPathParentCurrent(): string {
			if (this.currentParentGroupPathArray.length === 0) { return ""; }
			return this.currentParentGroupPathArray.join("/");
		}
		private _SaveRestoreGroupHeaderLoopHandler(
			Mode: SaveRestoreModes, elementIndex: number, groupHeaderElement: Element): void {
			var $groupHeaderElement = $(groupHeaderElement);
			var groupState = this._get_GroupState($groupHeaderElement);
			if (!groupState) {
				return;
			}
			this._GroupHeader_GroupLevelProcessing(groupState);
			groupState.ParentGroupText = this._get_GroupPathParentCurrent();

			switch (Mode) {
				case SaveRestoreModes.Save:
					this._SaveGroupStateForHeaderElement(groupState);
					break;
				case SaveRestoreModes.Restore:
					this._RestoreGroupStateForHeaderElement(groupState, $groupHeaderElement);
					break;
			}
		}

		/**
		 * Ensure that group tracking is reset when the top-level group changes (to prevent excessive memory consumption).
		 * @param {GroupState} groupState
		 */
		private _TrackTopLevelGroupChanges(groupState: GroupState): void {
			if (groupState.GroupData.level === 0) {
				if (!this.currentTopLevelGroupName) {
					this.currentTopLevelGroupName = groupState.GroupData.fieldName;
				} else {
					if (this.currentTopLevelGroupName !== groupState.GroupData.fieldName) {
						this.currentTopLevelGroupName = groupState.GroupData.fieldName;
						this.ResetGroupState();
					}
				}
			}
		}
		/**
		 * Determine nesting level/changes.
		 * @param {GroupState} groupState
		 */
		private _GroupHeader_GroupLevelProcessing(groupState: GroupState): void {
			if (this.lastGroupLevel === -1) {
				this.groupLevelRootValue = groupState.GroupData.level;
			}
			var groupLevel = groupState.GroupData.level;

			if (groupLevel !== this.lastGroupLevel) {
				var groupLevelChange: number = this.lastGroupLevel - groupLevel;
				if (groupLevel === this.groupLevelRootValue) {
					this.currentParentGroupPathArray.length = 0;
				} else if (groupLevel < this.lastGroupLevel) {
					for (var i = 0; i < groupLevelChange; i++) {
						this.currentParentGroupPathArray.pop();
					}
				} else if (groupLevel > this.lastGroupLevel) {
					this.currentParentGroupPathArray.push(this.lastGroupKey);
				}
			}
			this.lastGroupLevel = groupLevel;
			this.lastGroupKey = groupState.GroupData.key;
			this._TrackTopLevelGroupChanges(groupState);
		}
		private _ToggleButton_Check($groupHeaderElement: JQuery): ToggleButtonState {
			var $toggleButtonElement = this._get_$groupToggleElementInHeader($groupHeaderElement);
			if ($toggleButtonElement.length > 0) {
				if ($toggleButtonElement.hasClass(this.setup.GroupToggleElementExpandCssClass)
					|| $toggleButtonElement.hasClass(this.setup.GroupToggleElementCollapseCssClass)) {
					return {
						IsExpanded: $toggleButtonElement.hasClass(
							this.setup.GroupToggleElementCollapseCssClass),
						ButtonElement: $toggleButtonElement
					};
				}
			}
		}
		private _get_GroupState($groupHeaderElement: JQuery): GroupState {
			var groupKey = this._get_GroupData($groupHeaderElement);

			if (groupKey) {
				return new GroupState(
					groupKey,
					this._ToggleButton_Check($groupHeaderElement));
			}
			return null;
		}
		private _get_GroupData($groupHeaderElement: JQuery): IGroupData {
			if ($groupHeaderElement.length === 0) {
				return null;
			}

			return this.setup.GetGroupKeyByRow($groupHeaderElement);
		}
		//#endregion

		private _SaveGroupStateForHeaderElement(groupState: GroupState) {
			if (groupState) {
				if (groupState.ToggleButtonState.IsExpanded) {
					this._GroupItem_Add(this.groupsExpanded, groupState.FullGroupText());
					this._GroupItem_Remove(this.groupsCollapsed, groupState.FullGroupText());
				} else {
					this._GroupItem_Add(this.groupsCollapsed, groupState.FullGroupText());
					this._GroupItem_Remove(this.groupsExpanded, groupState.FullGroupText());
				}
			}
		}
		private _RestoreGroupStateForHeaderElement(groupState: GroupState, $groupHeaderElement: JQuery) {
			if (groupState) {
				//NOTE: If a default toggle action is specified, it will execute only if the group was never in an expanded or collapsed state, e.g. when the grid first loads or is initially grouped.
				var Action = this.defaultGroupToggleAction;

				var fullGroupText = groupState.FullGroupText();
				var previousGroupStateExpanded = this.groupsExpanded.indexOf(fullGroupText) !== -1;
				var previousGroupStateCollapsed = this.groupsCollapsed.indexOf(fullGroupText) !== -1;

				var groupIsExpanded = groupState.ToggleButtonState.IsExpanded;
				if (Action !== GroupToggleActions.None) {
					if ((groupIsExpanded && previousGroupStateExpanded)
						|| (!groupIsExpanded && previousGroupStateCollapsed)) {
						Action = GroupToggleActions.None;
					}
				}

				if (groupIsExpanded && previousGroupStateCollapsed) {
					Action = GroupToggleActions.Collapse;
				} else if (!groupIsExpanded && previousGroupStateExpanded) {
					Action = GroupToggleActions.Expand;
				}

				if (Action !== GroupToggleActions.None) {
					if (typeof this.setup.ToggleGroupByRow === "function") {
						this.setup.ToggleGroupByRow($groupHeaderElement, Action);
					} else {
						groupState.ToggleButtonState.ButtonElement.click();
					}
				}
			}
		}

		//#endregion

		//#region Save Group State

		//#region Asynchronous
		private saveGroupStateElementInterval: number = null;
		SaveGroupStateAsync(resetGroupState = false): void {
			//console.log("Begin save group state...");
			this._SaveScrollPosition();

			var $tableElement = this.setup.GetGridTableElement();

			this._set_$TableElement($tableElement);
			if (resetGroupState) {
				this.ResetGroupState();
			}

			this._SaveGroupStateWaitCheck();
		}
		private _SaveGroupStateWaitCheck() {
			if (this.saveGroupStateElementInterval) {
				this._SaveGroupStateAsyncStop();
			}
			this._SaveGroupStateContinue();
		}
		private _SaveGroupStateContinue() {
			this._BeginSaveRestore();

			var $groupHeaderElements = this._get_$GroupHeaderElements();
			if (!$groupHeaderElements) { return; }

			var elementIndex = 0;
			var elementsLength = $groupHeaderElements.length;
			this.saveGroupStateElementInterval = setInterval(() => {
				for (var batchIndex = 0;
					batchIndex < 20 && elementIndex < elementsLength;
					batchIndex++) {
					this._SaveRestoreGroupHeaderLoopHandler(
						SaveRestoreModes.Save, elementIndex, $groupHeaderElements.get(elementIndex));
					elementIndex++;
				}
				if (elementIndex >= elementsLength) {
					this._SaveGroupStateAsyncStop();
					//console.log("Save complete, processed " + (elementIndex + 1).toString() + " elements.");
				}
			}, 0);
		}
		private _SaveGroupStateAsyncStop() {
			clearInterval(this.saveGroupStateElementInterval);
			this.saveGroupStateElementInterval = null;
		}
		//#endregion

		//#region Synchronous
		private _SaveGroupState() {
			this._BeginSaveRestore();

			var thisClass = this;
			var $groupHeaderElements = this._get_$GroupHeaderElements();
			if ($groupHeaderElements) {
				$groupHeaderElements.each(
					(elementIndex, groupHeaderElement) =>
						thisClass._SaveRestoreGroupHeaderLoopHandler(
							SaveRestoreModes.Save, elementIndex, groupHeaderElement));
			}
		}
		SaveGroupStateFinishCheck(forceSave = false, resetGroupState = false) {
			if (!resetGroupState) {
				this._SaveScrollPosition();
			}

			var $tableElement = this.setup.GetGridTableElement();
			this._set_$TableElement($tableElement);
			if (resetGroupState) {
				this.ResetGroupState();
			}

			if (this.saveGroupStateElementInterval || forceSave) {
				this._SaveGroupStateAsyncStop();
				this._SaveGroupState();
			}
		}
		//#endregion

		//#endregion

		//#region Restore Group State
		RestoreGroupState(defaultGroupToggleAction: GroupToggleActions = GroupToggleActions.None): void {
			var $tableElement = this.setup.GetGridTableElement();

			if (this.groupsExpanded.length === 0
				&& this.groupsCollapsed.length === 0
				&& this.defaultGroupToggleAction === GroupToggleActions.None) {
				this._RestoreScrollPosition();
				return;
			}
			this._RestoreGroupStateInner($tableElement, defaultGroupToggleAction);

			setTimeout(() => this._RestoreScrollPosition(), 0);
		}
		private defaultGroupToggleAction: GroupToggleActions;
		private _RestoreGroupStateInner($tableElement: JQuery,
			defaultGroupToggleAction: GroupToggleActions = GroupToggleActions.None) {
			if (this.saveGroupStateElementInterval) {
				clearInterval(this.saveGroupStateElementInterval);
			}
			this._set_$TableElement($tableElement);
			this.defaultGroupToggleAction = defaultGroupToggleAction;

			var thisClass = this;
			this.pauseGroupStateChangeEventHandlers = true;
			this._BeginSaveRestore();

			var $groupHeaderElements = this._get_$GroupHeaderElements();
			if ($groupHeaderElements) {
				$groupHeaderElements.each(
					(elementIndex, groupHeaderElement) =>
						thisClass._SaveRestoreGroupHeaderLoopHandler(
							SaveRestoreModes.Restore, elementIndex, groupHeaderElement));
			}

			this.pauseGroupStateChangeEventHandlers = false;
		}

		//#endregion

		ResetGroupState(): void {
			this.groupsExpanded.length = 0;
			this.groupsCollapsed.length = 0;
			this.scrollPositionsByPageIndex.length = 0;
			this.lastPageIndex = null;
		}

		//#endregion

		//#region Actions
		ToggleAllGroups(action: GroupToggleActions): void {
			var $tableElement = this.setup.GetGridTableElement();

			this._set_$TableElement($tableElement);
			this.ResetGroupState();
			this._RestoreGroupStateInner($tableElement, action);
		}
		//#endregion

		//#region Scroll Position
		private scrollPositionsByPageIndex: number[] = [];
		private lastPageIndex: number = null;
		private _SaveScrollPosition(): void {
			if (!this.setup.GridOptions.SaveGridScrollPosition) { return; }

			var data = this.setup.GetSaveScrollPositionData();
			if (!data) { return; }

			if (data.$ScrollElement && data.$ScrollElement.length === 1
				&& typeof data.PageIndex === "number") {
				this.scrollPositionsByPageIndex[data.PageIndex] = data.$ScrollElement.get(0).scrollTop;
				//Check if scroll is at bottom
				if (data.$ScrollElement[0].scrollHeight - data.$ScrollElement.scrollTop() == data.$ScrollElement.outerHeight()) {
					this.scrollPositionsByPageIndex[data.PageIndex + 1] = 0;
					this.scrollPositionsByPageIndex[data.PageIndex - 1] = 10000;
				}
				this.lastPageIndex = data.PageIndex;
			}
		}
		private _RestoreScrollPosition(): void {
			if (!this.setup.GridOptions.SaveGridScrollPosition) { return; }

			var data = this.setup.GetSaveScrollPositionData();
			if (!data) { return; }

			if (data.$ScrollElement && data.$ScrollElement.length === 1
				&& typeof data.PageIndex === "number") {
				var savedScrollTop = this.scrollPositionsByPageIndex[data.PageIndex];
				if (!savedScrollTop) {
					savedScrollTop = 0;
				}
				data.$ScrollElement.animate({
					scrollTop: savedScrollTop
				});
			}
		}
		//#endregion
	}
}