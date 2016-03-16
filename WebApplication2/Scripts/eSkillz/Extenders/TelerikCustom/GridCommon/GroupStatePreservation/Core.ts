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
	class ToggleButtonState {
		constructor(
			public isExpanded: boolean,
			public buttonElement: JQuery) {

		}
	}
	class GroupState {
		public parentGroupText: string = "";
		constructor(
			public groupData: IGroupData,
			public toggleButtonState: ToggleButtonState) {

		}
		FullGroupText(): string {
			return this.parentGroupText + "/" + this.groupData.key;
		}
	}

	export enum GroupToggleActions {
		None = 0,
		Collapse = 1,
		Expand = 2
	}

	export type typeDelegateGetGroupDataByRow = ($groupHeaderElement: JQuery) => IGroupData;
	export type typeDelegateToggleGroupByRow = ($groupHeaderElement: JQuery, toggleAction: GroupToggleActions) => void;

	export interface IImplementation {
		GetGroupDataByRow: typeDelegateGetGroupDataByRow;
		ToggleGroupByRow: typeDelegateToggleGroupByRow;
		SaveGroupStateAsync: () => void;
		SaveGroupStateFinishCheck: (forceSave?: boolean) => void;
		RestoreGroupState: (defaultGroupToggleAction: GroupToggleActions) => void;
		ResetGroupState: () => void;
	}

	export type GroupHeaderElementChildType = HTMLTableCellElement;

	export class Options {
		constructor(
			public groupHeaderElementSelector: string,
			public groupHeaderChildren_ToggleElementSelector: string,
			public groupHeaderChildren_ToggleElementSelectorFilter: string,
			public groupHeaderChildren_TextElementSelector: string,
			public groupHeaderChildren_TextElementSelectorFilter: string,
			public groupToggleElementClass_Expand: string,
			public groupToggleElementClass_Collapse: string,
			public delegateGetGroupKeyByRow: typeDelegateGetGroupDataByRow,
			public delegateToggleGroupByRow: typeDelegateToggleGroupByRow = null) {
		}

		//#region Toggle Elements
		get_ExpandToggleElementSelector(): string {
			return this.groupHeaderElementSelector
				+ " " + this.groupHeaderChildren_ToggleElementSelector
				+ "." + this.groupToggleElementClass_Expand;
		}
		get_CollapseToggleElementSelector(): string {
			return this.groupHeaderElementSelector
				+ " " + this.groupHeaderChildren_ToggleElementSelector
				+ "." + this.groupToggleElementClass_Collapse;
		}
		get_ExpandAndCollapseToggleElementsSelector(): string {
			return this.get_ExpandToggleElementSelector() + ", " + this.get_CollapseToggleElementSelector();
		}
		//#endregion

		//#region Text Elements
		get_TextElementSelector(): string {
			var selector = this.groupHeaderElementSelector
				+ " " + this.groupHeaderChildren_TextElementSelector;
			return selector;
		}
		//#endregion
	}

	export class Core {
		constructor(private _Options: Options) { }

		get_Options() {
			return this._Options;
		}

		//#region Selectors
		private $tableElement: JQuery;
		set_$TableElement($element: JQuery): void {
			this.$tableElement = $element;
		}
		private _get_$GroupHeaderElements(): JQuery {
			if (!this.$tableElement || this.$tableElement.length === 0) { return null; }
			return this.$tableElement.find(this._Options.groupHeaderElementSelector);
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
				this._Options.groupHeaderChildren_ToggleElementSelector,
				this._Options.groupHeaderChildren_ToggleElementSelectorFilter);
		}

		private _get_$groupToggleElementInHeader($groupHeaderElement: JQuery): JQuery {
			return this._get_$GroupHeaderChildElementWithinHeader(
				$groupHeaderElement,
				this._Options.groupHeaderChildren_ToggleElementSelector,
				this._Options.groupHeaderChildren_ToggleElementSelectorFilter);
		}
		//#endregion

		//#region Text Elements
		private _get_$GroupTextElementsAll(): JQuery {
			return this._get_$GroupHeaderChildElements(
				this._Options.groupHeaderChildren_TextElementSelector,
				this._Options.groupHeaderChildren_TextElementSelectorFilter);
		}
		//#endregion

		//#endregion

		//#region Group Expanded/Collapsed State Tracking
		private groupsExpanded: Array<string> = [];
		private groupsCollapsed: Array<string> = [];

		private _groupItem_Add(list: Array<string>, value: string) {
			if (list.indexOf(value) === -1) {
				list.push(value);
			}
		}
		private _groupItem_Remove(list: Array<string>, value: string) {
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
		private _beginSaveRestore() {
			this.lastGroupLevel = -1;
			this.lastGroupKey = "";
			this.groupLevelRootValue = -1;
			this.currentParentGroupPathArray.length = 0;
		}
		private _get_GroupPathParentCurrent(): string {
			if (this.currentParentGroupPathArray.length === 0) { return ""; }
			return this.currentParentGroupPathArray.join("/");
		}
		private _saveRestoreGroupHeaderLoopHandler(
			Mode: SaveRestoreModes, elementIndex: number, groupHeaderElement: Element): void {
			var $groupHeaderElement = $(groupHeaderElement);
			var groupState = this._get_GroupState($groupHeaderElement);
			if (!groupState) {
				return;
			}
			this._groupHeader_GroupLevelProcessing(groupState);
			groupState.parentGroupText = this._get_GroupPathParentCurrent();

			switch (Mode) {
				case SaveRestoreModes.Save:
					this._saveGroupStateForHeaderElement(groupState);
					break;
				case SaveRestoreModes.Restore:
					this._restoreGroupStateForHeaderElement(groupState, $groupHeaderElement);
					break;
			}
		}

		/*
		 * Ensure that group tracking is reset when the top-level group changes (to prevent excessive memory consumption).
		 */
		private _trackTopLevelGroupChanges(groupState: GroupState): void {
			if (groupState.groupData.level === 0) {
				if (!this.currentTopLevelGroupName) {
					this.currentTopLevelGroupName = groupState.groupData.fieldName;
				} else {
					if (this.currentTopLevelGroupName !== groupState.groupData.fieldName) {
						this.currentTopLevelGroupName = groupState.groupData.fieldName;
						this.ResetGroupState();
					}
				}
			}
		}
		/**
		 * Determine nesting level/changes.
		 */
		private _groupHeader_GroupLevelProcessing(groupState: GroupState): void {
			if (this.lastGroupLevel === -1) {
				this.groupLevelRootValue = groupState.groupData.level;
			}
			var groupLevel = groupState.groupData.level;

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
			this.lastGroupKey = groupState.groupData.key;
			this._trackTopLevelGroupChanges(groupState);
		}
		private _checkToggleButton($groupHeaderElement: JQuery): ToggleButtonState {
			var $toggleButtonElement = this._get_$groupToggleElementInHeader($groupHeaderElement);
			if ($toggleButtonElement.length > 0) {
				if ($toggleButtonElement.hasClass(this._Options.groupToggleElementClass_Expand)
					|| $toggleButtonElement.hasClass(this._Options.groupToggleElementClass_Collapse)) {
					return {
						isExpanded: $toggleButtonElement.hasClass(
							this._Options.groupToggleElementClass_Collapse),
						buttonElement: $toggleButtonElement
					};
				}
			}
		}
		private _get_GroupState($groupHeaderElement: JQuery): GroupState {
			var groupKey = this._get_GroupData($groupHeaderElement);

			if (groupKey) {
				return new GroupState(
					groupKey,
					this._checkToggleButton($groupHeaderElement));
			}
			return null;
		}
		private _get_GroupData($groupHeaderElement: JQuery): IGroupData {
			if ($groupHeaderElement.length === 0) {
				return null;
			}

			return this._Options.delegateGetGroupKeyByRow($groupHeaderElement);
		}
		//#endregion

		//#region Save
		private _saveGroupStateForHeaderElement(groupState: GroupState) {
			if (groupState) {
				if (groupState.toggleButtonState.isExpanded) {
					this._groupItem_Add(this.groupsExpanded, groupState.FullGroupText());
					this._groupItem_Remove(this.groupsCollapsed, groupState.FullGroupText());
				} else {
					this._groupItem_Add(this.groupsCollapsed, groupState.FullGroupText());
					this._groupItem_Remove(this.groupsExpanded, groupState.FullGroupText());
				}
			}
		}
		//#endregion

		//#region Restore
		private _restoreGroupStateForHeaderElement(groupState: GroupState, $groupHeaderElement: JQuery) {
			if (groupState) {
				//NOTE: If a default toggle action is specified, it will execute only if the group was never in an expanded or collapsed state, e.g. when the grid first loads or is initially grouped.
				var Action = this._defaultGroupToggleAction;

				var fullGroupText = groupState.FullGroupText();
				var previousGroupStateExpanded = this.groupsExpanded.indexOf(fullGroupText) !== -1;
				var previousGroupStateCollapsed = this.groupsCollapsed.indexOf(fullGroupText) !== -1;

				var groupIsExpanded = groupState.toggleButtonState.isExpanded;
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
					if (typeof this._Options.delegateToggleGroupByRow === "function") {
						this._Options.delegateToggleGroupByRow($groupHeaderElement, Action);
					} else {
						groupState.toggleButtonState.buttonElement.click();
					}
				}
			}
		}
		//#endregion

		//#endregion

		//#region Save Group State

		//#region Asynchronous
		private _saveGroupStateElementInterval: number = null;
		SaveGroupStateAsync($tableElement: JQuery, resetGroupState = false): void {
			//console.log("Begin save group state...");
			this.set_$TableElement($tableElement);
			if (resetGroupState) {
				this.ResetGroupState();
			}

			this._saveGroupStateWaitCheck();
		}
		private _saveGroupStateWaitCheck() {
			if (this._saveGroupStateElementInterval) {
				this._saveGroupStateAsyncStop();
			}
			this._saveGroupStateContinue();
		}
		private _saveGroupStateContinue() {
			this._beginSaveRestore();

			var $groupHeaderElements = this._get_$GroupHeaderElements();
			if (!$groupHeaderElements) { return; }

			var elementIndex = 0;
			var elementsLength = $groupHeaderElements.length;
			this._saveGroupStateElementInterval = setInterval(() => {
				for (var batchIndex = 0;
					batchIndex < 20 && elementIndex < elementsLength;
					batchIndex++) {
					this._saveRestoreGroupHeaderLoopHandler(
						SaveRestoreModes.Save, elementIndex, $groupHeaderElements.get(elementIndex));
					elementIndex++;
				}
				if (elementIndex >= elementsLength) {
					this._saveGroupStateAsyncStop();
					//console.log("Save complete, processed " + (elementIndex + 1).toString() + " elements.");
				}
			}, 0);
		}
		private _saveGroupStateAsyncStop() {
			clearInterval(this._saveGroupStateElementInterval);
			this._saveGroupStateElementInterval = null;
		}
		//#endregion

		//#region Synchronous
		private _saveGroupState() {
			this._beginSaveRestore();

			var thisClass = this;
			var $groupHeaderElements = this._get_$GroupHeaderElements();
			if ($groupHeaderElements) {
				$groupHeaderElements.each(
					(elementIndex, groupHeaderElement) =>
						thisClass._saveRestoreGroupHeaderLoopHandler(
							SaveRestoreModes.Save, elementIndex, groupHeaderElement));
			}
		}
		SaveGroupStateFinishCheck($tableElement: JQuery, forceSave = false, resetGroupState = false) {
			this.set_$TableElement($tableElement);
			if (resetGroupState) {
				this.ResetGroupState();
			}

			if (this._saveGroupStateElementInterval || forceSave) {
				this._saveGroupStateAsyncStop();
				this._saveGroupState();
			}
		}
		//#endregion

		//#endregion

		//#region Restore Group State

		RestoreGroupState(
			$tableElement: JQuery,
			defaultGroupToggleAction: GroupToggleActions = GroupToggleActions.None): void {
			if (this.groupsExpanded.length === 0
				&& this.groupsCollapsed.length === 0
				&& this._defaultGroupToggleAction === GroupToggleActions.None) {
				return;
			}
			this._restoreGroupStateInner($tableElement, defaultGroupToggleAction);
		}
		private _defaultGroupToggleAction: GroupToggleActions;
		private _restoreGroupStateInner($tableElement: JQuery,
			defaultGroupToggleAction: GroupToggleActions = GroupToggleActions.None) {
			if (this._saveGroupStateElementInterval) {
				clearInterval(this._saveGroupStateElementInterval);
			}
			this.set_$TableElement($tableElement);
			this._defaultGroupToggleAction = defaultGroupToggleAction;

			var thisClass = this;
			this.pauseGroupStateChangeEventHandlers = true;
			this._beginSaveRestore();

			var $groupHeaderElements = this._get_$GroupHeaderElements();
			if ($groupHeaderElements) {
				$groupHeaderElements.each(
					(elementIndex, groupHeaderElement) =>
						thisClass._saveRestoreGroupHeaderLoopHandler(
							SaveRestoreModes.Restore, elementIndex, groupHeaderElement));
			}

			this.pauseGroupStateChangeEventHandlers = false;
		}

		//#endregion

		ResetGroupState(): void {
			this.groupsExpanded.length = 0;
			this.groupsCollapsed.length = 0;
			this._scrollPositionsByPageIndex.length = 0;
			this._lastPageIndex = null;
		}

		//#endregion

		//#region Actions
		ToggleAllGroups($tableElement: JQuery, action: GroupToggleActions): void {
			this.set_$TableElement($tableElement);
			this.ResetGroupState();
			this._restoreGroupStateInner($tableElement, action);
		}
		//#endregion

		//#region Scroll Position
		private _scrollPositionsByPageIndex: number[] = [];
		private _lastPageIndex: number = null;
		SaveScrollPosition($scrollElement: JQuery, pageIndex: number): void {
			if ($scrollElement && $scrollElement.length === 1
				&& typeof pageIndex === "number") {
				this._scrollPositionsByPageIndex[pageIndex] = $scrollElement.get(0).scrollTop;
				//Check if scroll is at bottom
				if ($scrollElement[0].scrollHeight - $scrollElement.scrollTop() == $scrollElement.outerHeight()) {
					this._scrollPositionsByPageIndex[pageIndex + 1] = 0;
					this._scrollPositionsByPageIndex[pageIndex - 1] = 10000;
				}
				this._lastPageIndex = pageIndex;
			}
		}
		RestoreScrollPosition($scrollElement: JQuery, pageIndex: number): void {
			if ($scrollElement && $scrollElement.length === 1
				&& typeof pageIndex === "number") {
				var savedScrollTop = this._scrollPositionsByPageIndex[pageIndex];
				if (!savedScrollTop) {
					savedScrollTop = 0;
				}
				$scrollElement.animate({
					scrollTop: savedScrollTop
				});
			}
		}
		//#endregion
	}
}