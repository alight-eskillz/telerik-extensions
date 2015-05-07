/// <reference path="../../../../../typings/app_shared.d.ts" />
/// <reference path="../../../../../typings/telerik/telerik.web.ui.d.ts" />
/// <reference path="../../../../../typings/microsoft-ajax/microsoft.ajax.d.ts" />
/// <reference path="../../../../../typings/jquery/jquery.d.ts" />

module eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation {
	enum SaveRestoreModes {
		Save = 1,
		Restore = 2
	}
	interface ICheckToggleButtonResult {
		IsToggleButton: boolean;
		ToggleStateIsExpanded?: boolean;
		ToggleButtonElement?: JQuery;
	}
	class GroupState {
		constructor(
			public GroupText: string,
			public ParentGroupText: string,
			public CheckToggleButtonResult: ICheckToggleButtonResult) {

		}
		FullGroupText(): string {
			return this.ParentGroupText + "/" + this.GroupText;
		}
	}

	export interface IImplementation {
		SaveGroupingAsync: () => void;
		FinishSaveGroupingCheck: (forceSave?: boolean) => void;
		RestoreGrouping: () => void;
		ResetGrouping: () => void;
	}
	export interface IImplementationOptions {
		groupByExpressionAggregates_AutoStrip: boolean;
		groupByExpressionAggregates_SecondDisplayName: string;
	}

	type GroupHeaderElementChildType = HTMLTableCellElement;

	export class Options {
		constructor(
			public groupHeaderElementSelector: string,
			public groupHeaderChildren_ToggleElementSelector: string,
			public groupHeaderChildren_ToggleElementSelectorFilter: string,
			public groupHeaderChildren_TextElementSelector: string,
			public groupHeaderChildren_TextElementSelectorFilter: string,
			public groupToggleElementClass_Expand: string,
			public groupToggleElementClass_Collapse: string,
			public groupingSettings_GroupByFieldsSeparator: string,
			public implementationOptions: IImplementationOptions,
			public groupColumnNameValueSplitter = ":",
			public groupHeaderTextElementClass: string = null) {

		}
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
		private _$find_GroupTextElements($preFindElements: JQuery) {
			if (this._Options.groupHeaderTextElementClass && $preFindElements.length > 0) {
				return $preFindElements.find("." + this._Options.groupHeaderTextElementClass);
			} else {
				return $preFindElements;
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
			return this._$find_GroupTextElements(
				this._get_$groupHeaderChildElements(
					this._Options.groupHeaderChildren_TextElementSelector,
					this._Options.groupHeaderChildren_TextElementSelectorFilter));
		}

		private _get_$groupTextElementInHeader($groupHeaderElement: JQuery): JQuery {
			return this._$find_GroupTextElements(
				this._get_$GroupHeaderChildElementWithinHeader(
					$groupHeaderElement,
					this._Options.groupHeaderChildren_TextElementSelector,
					this._Options.groupHeaderChildren_TextElementSelectorFilter));
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
		private _lastNestLevel: number;
		private _nestingRootColSpan: number;
		private _currentTopLevelGroupName: string = null;
		private _currentParentGroupPathArray: Array<string>;
		private _beginSaveRestore() {
			this._lastNestLevel = -1;
			this._nestingRootColSpan = -1;
			this._currentParentGroupPathArray = [];
		}
		private _getCurrentParentGroupPath(): string {
			if (this._currentParentGroupPathArray.length === 0) { return ""; }
			return this._currentParentGroupPathArray.join("/");
		}
		private _SaveRestoreGroupHeaderLoopHandler(
			Mode: SaveRestoreModes, elementIndex: number, groupHeaderElement: Element): void {
			var $groupHeaderElement = $(groupHeaderElement);

			this._groupHeaderNestLevelProcessing($groupHeaderElement);

			switch (Mode) {
				case SaveRestoreModes.Save:
					this._saveGroupingForHeaderElement($groupHeaderElement);
					break;
				case SaveRestoreModes.Restore:
					this._restoreGroupingForHeaderElement($groupHeaderElement);
					break;
			}
		}

		private _get_GroupColumnDisplayName(GroupText: string): string {
			if (!GroupText || GroupText === "") { return null; }
			return GroupText.substring(0, GroupText.indexOf(this._Options.groupColumnNameValueSplitter));
		}
		/*
		 * Ensure that group tracking is reset when the top-level group changes (to prevent excessive memory consumption).
		 */
		private _trackTopLevelGroupChanges(nestLevel: number, groupText: string): void {
			if (nestLevel === 0) {
				var currentGroupColumnName = this._get_GroupColumnDisplayName(groupText);
				if (currentGroupColumnName) {
					if (!this._currentTopLevelGroupName) {
						this._currentTopLevelGroupName = currentGroupColumnName;
					} else {
						if (this._currentTopLevelGroupName !== currentGroupColumnName) {
							this._currentTopLevelGroupName = currentGroupColumnName;
							this.ResetGrouping();
						}
					}
				}
			}
		}
		/**
		 * Determine nesting level/changes.
		 */
		private _groupHeaderNestLevelProcessing($groupHeaderElement: JQuery): void {
			var groupHeaderLastChildElement = <GroupHeaderElementChildType>(
				this._get_$groupTextElementInHeader($groupHeaderElement).get(0));
			var groupText = this._get_GroupText($groupHeaderElement);

			if (this._lastNestLevel === -1) {
				this._nestingRootColSpan = groupHeaderLastChildElement.colSpan;
			}
			var nestLevel = (this._nestingRootColSpan - groupHeaderLastChildElement.colSpan);

			if (nestLevel !== this._lastNestLevel) {
				var nestLevelChange: number = this._lastNestLevel - nestLevel;
				if (nestLevel === 0) {
					this._currentParentGroupPathArray = [];
				} else if (nestLevel < this._lastNestLevel) {
					for (var i = 0; i < nestLevelChange; i++) {
						this._currentParentGroupPathArray.pop();
					}
				} else if (nestLevel > this._lastNestLevel) {
					this._currentParentGroupPathArray.push(
						this._get_GroupText($groupHeaderElement.prev()));
				}
			}
			this._lastNestLevel = nestLevel;
			this._trackTopLevelGroupChanges(nestLevel, groupText);
		}
		private _checkToggleButton($groupHeaderElement: JQuery): ICheckToggleButtonResult {
			var $toggleButtonElement = this._get_$groupToggleElementInHeader($groupHeaderElement);
			if ($toggleButtonElement.length > 0) {
				if ($toggleButtonElement.hasClass(this._Options.groupToggleElementClass_Expand)
					|| $toggleButtonElement.hasClass(this._Options.groupToggleElementClass_Collapse)) {
					return {
						IsToggleButton: true,
						ToggleStateIsExpanded: $toggleButtonElement.hasClass(
							this._Options.groupToggleElementClass_Collapse),
						ToggleButtonElement: $toggleButtonElement
					};
				}
			}
			return { IsToggleButton: false };
		}
		private _get_GroupState($groupHeaderElement: JQuery): GroupState {
			var GroupText = this._get_GroupText($groupHeaderElement);

			if (GroupText) {
				var _checkToggleButtonResult = this._checkToggleButton($groupHeaderElement);
				return new GroupState(
					GroupText,
					this._getCurrentParentGroupPath(),
					_checkToggleButtonResult);
			}
			return null;
		}
		private _get_GroupText($groupHeaderElement: JQuery) {
			if ($groupHeaderElement.length === 0) {
				return null;
			}
			var $groupTextElement = this._get_$groupTextElementInHeader($groupHeaderElement);
			if ($groupTextElement.length === 0) {
				return null;
			}

			var groupText = $groupTextElement.text();
			if (this._Options.implementationOptions.groupByExpressionAggregates_AutoStrip) {
				var groupByExpressionsProcessed = false;
				if (this._Options.implementationOptions.groupByExpressionAggregates_SecondDisplayName
					&& groupText.indexOf(
						this._Options.implementationOptions.groupByExpressionAggregates_SecondDisplayName) > -1) {
					groupText = groupText.substring(
						0, groupText.indexOf(
							this._Options.groupingSettings_GroupByFieldsSeparator
							+ this._Options.implementationOptions.groupByExpressionAggregates_SecondDisplayName));
					groupByExpressionsProcessed = true;
				}
				if ((!groupByExpressionsProcessed)
					&& groupText.indexOf(this._Options.groupingSettings_GroupByFieldsSeparator) > - 1) {
					//GroupByExpression (Aggregates) are likely present but not identified explicitly, so strip manually.
					groupText = groupText.substring(
						0, groupText.indexOf(this._Options.groupingSettings_GroupByFieldsSeparator));
				}
			}

			var finalGroupText = groupText.trim();
			if (finalGroupText === "") {
				return null;
			}

			return finalGroupText;
		}
		//#endregion

		//#region Save
		private _saveGroupingForHeaderElement($groupHeaderElement: JQuery) {
			var groupState = this._get_GroupState($groupHeaderElement);

			if (groupState) {
				if (groupState.CheckToggleButtonResult.ToggleStateIsExpanded) {
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
		private _restoreGroupingForHeaderElement($groupHeaderElement: JQuery) {
			var groupState = this._get_GroupState($groupHeaderElement);
			if (groupState) {
				if (groupState.CheckToggleButtonResult.ToggleStateIsExpanded
					&& this._groupsCollapsed.indexOf(groupState.FullGroupText()) !== -1) {
					groupState.CheckToggleButtonResult.ToggleButtonElement.click();
				} else if (!groupState.CheckToggleButtonResult.ToggleStateIsExpanded
					&& this._groupsExpanded.indexOf(groupState.FullGroupText()) !== -1) {
					groupState.CheckToggleButtonResult.ToggleButtonElement.click();
				}
			}
		}
		//#endregion

		//#endregion

		//#region Save Grouping

		//#region Asynchronous
		private _saveGroupingElementInterval: number = null;
		SaveGroupingAsync($tableElement: JQuery, resetGrouping = false): void {
			console.log("Begin save grouping...");
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
					console.log("Save complete, processed " + (elementIndex + 1).toString() + " elements.");
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

		RestoreGrouping($tableElement: JQuery): void {
			if (this._groupsExpanded.length === 0 && this._groupsCollapsed.length === 0) {
				return;
			}
			if (this._saveGroupingElementInterval) {
				clearInterval(this._saveGroupingElementInterval);
			}
			this.set_tableElement($tableElement);

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
		ResetGrouping(): void {
			this._groupsExpanded = [];
			this._groupsCollapsed = [];
		}
		//#endregion
	}
}