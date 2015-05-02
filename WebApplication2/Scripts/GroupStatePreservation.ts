/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/microsoft-ajax/microsoft.ajax.d.ts" />
/// <reference path="typings/telerik/telerik.web.ui.d.ts" />
/// <reference path="typings/app_shared.d.ts" />

module ClApps_Common.Extenders.TelerikCustom.RadGrid.GroupStatePreservation {
	export enum RefreshModes {
		ClientDataSource = 1,
		AJAX = 2
	}
	export class Options {
		constructor(
			public gridClientID: string,
			public RefreshMode: RefreshModes = null,
			public groupByExpressionAggregates_AutoStrip: boolean = false,
			public groupByExpressionAggregates_SecondDisplayName: string = null,
			public addEventHandlers: boolean = true,
			public saveGridScrollPosition: boolean = false,
			public gridContainerSelector: string = null) {

		}
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
	enum SaveRestoreModes {
		Save = 1,
		Restore = 2
	}
	interface ICheckToggleButtonResult {
		IsToggleButton: boolean;
		ToggleStateIsExpanded?: boolean;
		ToggleButtonElement?: JQuery;
	}

	type GroupHeaderElementChildType = HTMLTableCellElement;

	export class Core {
		constructor(private _Options: Options) {
			this._Initialize();
		}
		get_Options() {
			return this._Options;
		}

		static groupHeaderElementSelector = "tr.rgGroupHeader";
		static groupHeaderElementChildTagName = "td";
		
		//NOTE: In order for this extension to work as is:
		//	- The Group Header element must be the last child of the groupHeaderElement.
		//	- The toggle element must be the second-to-last child of the groupHeaderElement.

		static GroupHeaderToggleElementName = "BUTTON";
		static GoupExpandCollapseElementClass_Expand = "rgExpand";
		static GroupExpandCollapseElementClass_Collapse = "rgCollapse";
		static GroupHeaderTextElementClass = null;	//if a specific class should be used to get the group header text element, set value here (Telerik uses <span class="rgGroupHeaderText">...</span> when header template is not customized); under normal conditions, it should be fine to exclude this value.

		static GroupingSettings_GroupByFieldsSeparator: string;

		private _Initialize() {
			if (!this._Options.RefreshMode) {
				if (console && typeof console.log === "function") {
					console.log("Error, must specify Options.RefreshMode.");
				}
				return;
			}

			var grid = this.get_Grid();

			var gridInternalProperties: TelerikInternalProps.Web.UI.RadGrid = (<any>grid);
			if (gridInternalProperties._groupingSettings) {
				Core.GroupingSettings_GroupByFieldsSeparator = gridInternalProperties._groupingSettings.GroupByFieldsSeparator;
			}

			this._addGroupStateChangeEventHandlers();
			switch (this._Options.RefreshMode) {
				case RefreshModes.ClientDataSource:
					this._InitializeStateTrackingModes_ClientSideData();
					break;
				case RefreshModes.AJAX:
					this._InitializeStateTrackingModes_Ajax();
					break;
			}
		}

		//#region Group State Change Event Handlers
		private gridGroupStateChangedHandler: (sender, args) => void;
		private _pauseGroupStateChangeEventHandlers = false;
		private _addGroupStateChangeEventHandlers() {
			var grid = this.get_Grid();
			this.gridGroupStateChangedHandler = (sender, args) => this._gridGroupStateChanged(sender, args);
			grid.add_groupExpanded(this.gridGroupStateChangedHandler);
			grid.add_groupCollapsed(this.gridGroupStateChangedHandler);
		}
		private _removeGroupStateChangeEventHandlers() {
			var grid = this.get_Grid();
			grid.remove_groupExpanded(this.gridGroupStateChangedHandler);
			grid.remove_groupCollapsed(this.gridGroupStateChangedHandler);
		}
		private _gridGroupStateChanged(sender, args: Telerik.Web.UI.GridGroupCollapsingEventArgs) {
			if (this._pauseGroupStateChangeEventHandlers) { return; }
			this.SaveGrouping();
		}
		//#endregion

		//#region AJAX Refresh Event Handlers
		private _InitializeStateTrackingModes_Ajax() {
			var prmInstance = Sys.WebForms.PageRequestManager.getInstance();
			if (!prmInstance) {
				if (console && typeof console.log === "function") {
					console.log("Error, Options.RefreshMode was set to AJAX, but there is no PageRequestManager.");
				}
				return;
			}
			prmInstance.add_beginRequest((sender, args) => this._PageRequestManager_BeginRequest(sender, args));
			prmInstance.add_endRequest((sender, args) => this._PageRequestManager_EndRequest(sender, args));
		}
		private _PageRequestManager_BeginRequest(sender, args: Sys.WebForms.BeginRequestEventArgs) {
			this._removeGroupStateChangeEventHandlers();
			this.SaveGrouping();
		}
		private _PageRequestManager_EndRequest(sender, args: Sys.WebForms.EndRequestEventArgs) {
			this.RestoreGrouping();
			this._addGroupStateChangeEventHandlers();
		}
		//#endregion

		//#region Client Data Source Event Handlers
		private _InitializeStateTrackingModes_ClientSideData() {
			var grid = this.get_Grid();
			grid.add_dataBound((sender, args) => this._Grid_OnDataBound(sender, args));
		}
		private _Grid_OnDataBound(sender, args) {
			this.RestoreGrouping();
		}
		//#endregion

		get_Grid() {
			return <Telerik.Web.UI.RadGrid>($find(this._Options.gridClientID));
		}
		get_GridMasterTableView(grid?: Telerik.Web.UI.RadGrid): Telerik.Web.UI.GridTableView {
			if (!grid) {
				grid = this.get_Grid();
			}
			try {
				return grid.get_masterTableView();
			} catch (err) {
				if (console && typeof console.log === "function") {
					console.log("RadGrid Group State Preservation: MasterTableView missing/error.");
				}
			}
		}

		//#region Scroll Position
		get_$GridDataElement(): JQuery {
			//Note: this element is available only when the grid has static headers and scrolling enabled in the grid
			var gridDataElement = $("#" + this._Options.gridClientID + "_GridData");
			if (gridDataElement.length === 1) {
				return gridDataElement;
			}
			return null;
		}
		private _containerScrollTop: number = 0;
		private _scrollPosition_Save() {
			if (this.get_Options().saveGridScrollPosition) {
				var $containerElement: JQuery;
				if (this._Options.gridContainerSelector) {
					$containerElement = $(this._Options.gridContainerSelector);
				} else {
					$containerElement = this.get_$GridDataElement();
				}
				if ($containerElement && $containerElement.length === 1) {
					this._containerScrollTop = $containerElement.get(0).scrollTop;
				} else {
					if (console && typeof console.log === "function") {
						console.log("RadGrid Group State Preservation: Scroll container not found.  Enable grid scrolling or specify a container selector in Options.");
					}
				}
			}
		}
		private _scrollPosition_Restore() {
			if (this.get_Options().saveGridScrollPosition) {
				var $containerElement: JQuery;
				if (this._Options.gridContainerSelector) {
					$containerElement = $(this._Options.gridContainerSelector);
				} else {
					$containerElement = this.get_$GridDataElement();
				}
				if ($containerElement && $containerElement.length === 1) {
					$containerElement.get(0).scrollTop = this._containerScrollTop;
				} else {
					if (console && typeof console.log === "function") {
						console.log("RadGrid Group State Preservation: Scroll container not found.  Enable grid scrolling or specify a container selector in Options.");
					}
				}
			}
		}
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

		static groupColumnNameValueSplitter = ":";
		private _get_GroupColumnDisplayName(GroupText: string): string {
			if (!GroupText || GroupText === "") { return null; }
			return GroupText.substring(0, GroupText.indexOf(Core.groupColumnNameValueSplitter));
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
				$groupHeaderElement.children(Core.groupHeaderElementChildTagName).last().get(0));
			var groupText = this._get_GroupText(this._get_GroupHeaderTextParentElement($groupHeaderElement));

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
						this._get_GroupText(this._get_GroupHeaderTextParentElement($groupHeaderElement.prev())));
				}
			}
			this._lastNestLevel = nestLevel;
			this._trackTopLevelGroupChanges(nestLevel, groupText);
		}
		private _get_$GroupHeaderElements(): JQuery {
			var masterTableView = this.get_GridMasterTableView();
			if (!masterTableView) { return null; }

			return $(masterTableView.get_element()).
				find(Core.groupHeaderElementSelector);
		}
		private _checkToggleButton($toggleButtonParentElement: JQuery): ICheckToggleButtonResult {
			var $toggleButtonElement = $toggleButtonParentElement.find(Core.GroupHeaderToggleElementName).first();
			if ($toggleButtonElement.length > 0) {
				if ($toggleButtonElement.hasClass(Core.GoupExpandCollapseElementClass_Expand)
					|| $toggleButtonElement.hasClass(Core.GroupExpandCollapseElementClass_Collapse)) {
					return {
						IsToggleButton: true,
						ToggleStateIsExpanded: $toggleButtonElement.hasClass(Core.GroupExpandCollapseElementClass_Collapse),
						ToggleButtonElement: $toggleButtonElement
					};
				}
			}
			return { IsToggleButton: false };
		}
		private _get_GroupState($groupHeaderTextParentElement: JQuery): GroupState {
			var GroupText = this._get_GroupText($groupHeaderTextParentElement);

			if (GroupText) {
				var _checkToggleButtonResult = this._checkToggleButton($groupHeaderTextParentElement.prev());
				return new GroupState(
					GroupText,
					this._getCurrentParentGroupPath(),
					_checkToggleButtonResult);
			}
			return null;
		}
		private _get_GroupHeaderTextParentElement($groupHeaderElement: JQuery): JQuery {
			return $groupHeaderElement.children(Core.groupHeaderElementChildTagName).last();
		}
		private _get_GroupText($groupHeaderTextParent: JQuery) {
			var $groupHeaderTextElement: JQuery;
			if (Core.GroupHeaderTextElementClass) {
				$groupHeaderTextElement = $groupHeaderTextParent.find("." + Core.GroupHeaderTextElementClass);
			} else {
				$groupHeaderTextElement = $groupHeaderTextParent;
			}
			if ($groupHeaderTextElement.length === 0) {
				return null;
			}

			var groupText = $groupHeaderTextElement.text();
			if (this._Options.groupByExpressionAggregates_AutoStrip) {
				var groupByExpressionsProcessed = false;
				if (this._Options.groupByExpressionAggregates_SecondDisplayName
					&& groupText.indexOf(this._Options.groupByExpressionAggregates_SecondDisplayName) > -1) {
					groupText = groupText.substring(
						0, groupText.indexOf(
							Core.GroupingSettings_GroupByFieldsSeparator
							+ this._Options.groupByExpressionAggregates_SecondDisplayName));
					groupByExpressionsProcessed = true;
				}
				if ((!groupByExpressionsProcessed)
					&& groupText.indexOf(Core.GroupingSettings_GroupByFieldsSeparator) > - 1) {
					//GroupByExpression (Aggregates) are likely present but not identified explicitly, so strip manually.
					groupText = groupText.substring(
						0, groupText.indexOf(Core.GroupingSettings_GroupByFieldsSeparator));
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
			var groupState = this._get_GroupState(this._get_GroupHeaderTextParentElement($groupHeaderElement));

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
			var groupState = this._get_GroupState(this._get_GroupHeaderTextParentElement($groupHeaderElement));
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

		SaveGrouping(resetGrouping = false) {
			if (resetGrouping) {
				this.ResetGrouping();
			}

			this._scrollPosition_Save();

			var thisClass = this;
			this._beginSaveRestore();

			var $groupHeaderElements = this._get_$GroupHeaderElements();
			if (!$groupHeaderElements) { return; }

			$groupHeaderElements.each(
				(elementIndex, groupHeaderElement) =>
					thisClass._SaveRestoreGroupHeaderLoopHandler(
						SaveRestoreModes.Save, elementIndex, groupHeaderElement));
		}
		RestoreGrouping() {
			if (this._groupsExpanded.length === 0 && this._groupsCollapsed.length === 0) {
				this._scrollPosition_Restore();
				return;
			}

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

			this._scrollPosition_Restore();
			this._pauseGroupStateChangeEventHandlers = false;
		}
		ResetGrouping() {
			this._groupsExpanded = [];
			this._groupsCollapsed = [];
			this._containerScrollTop = 0;
		}
		//#endregion
	}
}