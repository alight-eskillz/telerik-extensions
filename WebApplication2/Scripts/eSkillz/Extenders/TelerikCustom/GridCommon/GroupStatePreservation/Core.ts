/// <reference path="../../../../../typings/app_shared.d.ts" />
/// <reference path="../../../../../typings/telerik/telerik.web.ui.d.ts" />
/// <reference path="../../../../../typings/microsoft-ajax/microsoft.ajax.d.ts" />
/// <reference path="../../../../../typings/jquery/jquery.d.ts" />

module eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation {
	enum SaveRestoreModes {
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
		SaveGroupingAsync: () => void;
		FinishSaveGroupingCheck: (forceSave?: boolean) => void;
		RestoreGrouping: (defaultGroupToggleAction: GroupToggleActions) => void;
		ResetGrouping: () => void;
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
		private _$tableElement: JQuery;
		set_tableElement($element: JQuery): void {
			this._$tableElement = $element;
		}
		private _get_$GroupHeaderElements(): JQuery {
			if (!this._$tableElement || this._$tableElement.length === 0) { return null; }
			return this._$tableElement.find(this._Options.groupHeaderElementSelector);
		}
		private _get_$groupHeaderChildElements(selector: string, selectorFilter?: string): JQuery {
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
			return this._get_$groupHeaderChildElements(
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
			return this._get_$groupHeaderChildElements(
				this._Options.groupHeaderChildren_TextElementSelector,
				this._Options.groupHeaderChildren_TextElementSelectorFilter);
		}
		//#endregion

		//#endregion

		//#region Group Expanded/Collapsed State Tracking
		private _groupsExpanded: Array<string> = [];
		private _groupsCollapsed: Array<string> = [];

		private _groupItemAdd(list: Array<string>, value: string) {
			if (list.indexOf(value) === -1) {
				list.push(value);
			}
		}
		private _groupItemRemove(list: Array<string>, value: string) {
			var itemIndex = list.indexOf(value);
			if (itemIndex > -1) {
				list.splice(itemIndex, 1);
			}
		}

		//#region Pause Processing
		private _pauseGroupStateChangeEventHandlers = false;
		set_pauseGroupStateChangeEventHandlers(value: boolean): void {
			this._pauseGroupStateChangeEventHandlers = value;
		}
		get_pauseGroupStateChangeEventHandlers(): boolean {
			return this._pauseGroupStateChangeEventHandlers;
		}
		//#endregion

		//#region Helpers

		//#region Common
		private _lastGroupLevel: number;
		private _lastGroupKey: string;
		private _groupLevelRootValue: number;
		private _currentTopLevelGroupName: string = null;
		private _currentParentGroupPathArray: Array<string>;
		private _beginSaveRestore() {
			this._lastGroupLevel = -1;
			this._lastGroupKey = "";
			this._groupLevelRootValue = -1;
			this._currentParentGroupPathArray = [];
		}
		private _getCurrentParentGroupPath(): string {
			if (this._currentParentGroupPathArray.length === 0) { return ""; }
			return this._currentParentGroupPathArray.join("/");
		}
		private _SaveRestoreGroupHeaderLoopHandler(
			Mode: SaveRestoreModes, elementIndex: number, groupHeaderElement: Element): void {
			var $groupHeaderElement = $(groupHeaderElement);
			var groupState = this._get_GroupState($groupHeaderElement);
			this._groupHeader_GroupLevelProcessing(groupState);
			groupState.parentGroupText = this._getCurrentParentGroupPath();

			switch (Mode) {
				case SaveRestoreModes.Save:
					this._saveGroupingForHeaderElement(groupState);
					break;
				case SaveRestoreModes.Restore:
					this._restoreGroupingForHeaderElement(groupState, $groupHeaderElement);
					break;
			}
		}

		/*
		 * Ensure that group tracking is reset when the top-level group changes (to prevent excessive memory consumption).
		 */
		private _trackTopLevelGroupChanges(groupState: GroupState): void {
			if (groupState.groupData.level === 0) {
				if (!this._currentTopLevelGroupName) {
					this._currentTopLevelGroupName = groupState.groupData.fieldName;
				} else {
					if (this._currentTopLevelGroupName !== groupState.groupData.fieldName) {
						this._currentTopLevelGroupName = groupState.groupData.fieldName;
						this.ResetGrouping();
					}
				}
			}
		}
		/**
		 * Determine nesting level/changes.
		 */
		private _groupHeader_GroupLevelProcessing(groupState: GroupState): void {
			if (this._lastGroupLevel === -1) {
				this._groupLevelRootValue = groupState.groupData.level;
			}
			var groupLevel = groupState.groupData.level;

			if (groupLevel !== this._lastGroupLevel) {
				var groupLevelChange: number = this._lastGroupLevel - groupLevel;
				if (groupLevel === this._groupLevelRootValue) {
					this._currentParentGroupPathArray = [];
				} else if (groupLevel < this._lastGroupLevel) {
					for (var i = 0; i < groupLevelChange; i++) {
						this._currentParentGroupPathArray.pop();
					}
				} else if (groupLevel > this._lastGroupLevel) {
					this._currentParentGroupPathArray.push(this._lastGroupKey);
				}
			}
			this._lastGroupLevel = groupLevel;
			this._lastGroupKey = groupState.groupData.key;
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
		private _saveGroupingForHeaderElement(groupState: GroupState) {
			if (groupState) {
				if (groupState.toggleButtonState.isExpanded) {
					this._groupItemAdd(this._groupsExpanded, groupState.FullGroupText());
					this._groupItemRemove(this._groupsCollapsed, groupState.FullGroupText());
				} else {
					this._groupItemAdd(this._groupsCollapsed, groupState.FullGroupText());
					this._groupItemRemove(this._groupsExpanded, groupState.FullGroupText());
				}
			}
		}
		//#endregion

		//#region Restore
		private _restoreGroupingForHeaderElement(groupState: GroupState, $groupHeaderElement: JQuery) {
			if (groupState) {
				//NOTE: If a default toggle action is specified, it will execute only if the group was never in an expanded or collapsed state, e.g. when the grid first loads or is initially grouped.
				var Action = this._defaultGroupToggleAction;

				var fullGroupText = groupState.FullGroupText();
				var previousGroupStateExpanded = this._groupsExpanded.indexOf(fullGroupText) !== -1;
				var previousGroupStateCollapsed = this._groupsCollapsed.indexOf(fullGroupText) !== -1;

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

		//#region Save Grouping

		//#region Asynchronous
		private _saveGroupingElementInterval: number = null;
		SaveGroupingAsync($tableElement: JQuery, resetGrouping = false): void {
			//console.log("Begin save grouping...");
			this.set_tableElement($tableElement);
			if (resetGrouping) {
				this.ResetGrouping();
			}

			this._saveGroupingWaitCheck();
		}
		private _saveGroupingWaitCheck() {
			if (this._saveGroupingElementInterval) {
				this._saveGroupingAsyncStop();
			}
			this._saveGroupingContinue();
		}
		private _saveGroupingContinue() {
			this._beginSaveRestore();

			var $groupHeaderElements = this._get_$GroupHeaderElements();
			if (!$groupHeaderElements) { return; }

			var elementIndex = 0;
			var elementsLength = $groupHeaderElements.length;
			this._saveGroupingElementInterval = setInterval(() => {
				for (var batchIndex = 0;
					batchIndex < 20 && elementIndex < elementsLength;
					batchIndex++) {
					this._SaveRestoreGroupHeaderLoopHandler(
						SaveRestoreModes.Save, elementIndex, $groupHeaderElements.get(elementIndex));
					elementIndex++;
				}
				if (elementIndex >= elementsLength) {
					this._saveGroupingAsyncStop();
					//console.log("Save complete, processed " + (elementIndex + 1).toString() + " elements.");
				}
			}, 0);
		}
		private _saveGroupingAsyncStop() {
			clearInterval(this._saveGroupingElementInterval);
			this._saveGroupingElementInterval = null;
		}
		//#endregion

		//#region Synchronous
		private _saveGrouping() {
			this._beginSaveRestore();

			var thisClass = this;
			var $groupHeaderElements = this._get_$GroupHeaderElements();
			if ($groupHeaderElements) {
				$groupHeaderElements.each(
					(elementIndex, groupHeaderElement) =>
						thisClass._SaveRestoreGroupHeaderLoopHandler(
							SaveRestoreModes.Save, elementIndex, groupHeaderElement));
			}
		}
		FinishSaveGroupingCheck($tableElement: JQuery, forceSave = false, resetGrouping = false) {
			this.set_tableElement($tableElement);
			if (resetGrouping) {
				this.ResetGrouping();
			}

			if (this._saveGroupingElementInterval || forceSave) {
				this._saveGroupingAsyncStop();
				this._saveGrouping();
			}
		}
		//#endregion

		//#endregion

		//#region Restore Grouping

		RestoreGrouping($tableElement: JQuery,
			defaultGroupToggleAction: GroupToggleActions = GroupToggleActions.None): void {
			if (this._groupsExpanded.length === 0
				&& this._groupsCollapsed.length === 0
				&& this._defaultGroupToggleAction === GroupToggleActions.None) {
				return;
			}
			this._restoreGroupingInner($tableElement, defaultGroupToggleAction);
		}
		private _defaultGroupToggleAction: GroupToggleActions;
		private _restoreGroupingInner($tableElement: JQuery,
			defaultGroupToggleAction: GroupToggleActions = GroupToggleActions.None) {
			if (this._saveGroupingElementInterval) {
				clearInterval(this._saveGroupingElementInterval);
			}
			this.set_tableElement($tableElement);
			this._defaultGroupToggleAction = defaultGroupToggleAction;

			var thisClass = this;
			this._pauseGroupStateChangeEventHandlers = true;
			this._beginSaveRestore();

			var $groupHeaderElements = this._get_$GroupHeaderElements();
			if ($groupHeaderElements) {
				$groupHeaderElements.each(
					(elementIndex, groupHeaderElement) =>
						thisClass._SaveRestoreGroupHeaderLoopHandler(
							SaveRestoreModes.Restore, elementIndex, groupHeaderElement));
			}

			this._pauseGroupStateChangeEventHandlers = false;
		}

		//#endregion

		ResetGrouping(): void {
			this._groupsExpanded = [];
			this._groupsCollapsed = [];
		}

		//#endregion

		//#region Actions
		ToggleAllGroups($tableElement: JQuery, action: GroupToggleActions): void {
			this.set_tableElement($tableElement);
			this.ResetGrouping();
			this._restoreGroupingInner($tableElement, action);
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
				if ($scrollElement[0].scrollHeight - $scrollElement.scrollTop() === $scrollElement.outerHeight()) {
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