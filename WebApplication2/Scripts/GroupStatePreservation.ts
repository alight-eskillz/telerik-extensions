﻿/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/microsoft-ajax/microsoft.ajax.d.ts" />
/// <reference path="typings/telerik/telerik.web.ui.d.ts" />
/// <reference path="typings/app_shared.d.ts" />

$ = $telerik.$;

module ClApps_Common.Extenders.TelerikCustom.RadGrid.GroupStatePreservation {
	export class Options {
		constructor(
			public gridClientID: string,
			public groupByExpressionAggregates_AutoStrip: boolean = false,
			public groupByExpressionAggregates_SecondDisplayName: string = null,
			public clientDataSource_AddEventHandlers: boolean = false,
			public ajaxRefresh_AddEventHandlers: boolean = false,
			public saveGridScrollPosition: boolean = false,
			public gridContainerSelector: string = null) {

		}
	}

	class GroupState {
		constructor(
			public GroupText: string,
			public ParentGroupText: string,
			public IsExpanded: boolean,
			public ExpandCollapseButtonElement: HTMLInputElement) {

		}
		FullGroupText(): string {
			return this.ParentGroupText + "/" + this.GroupText;
		}
	}
	enum SaveRestoreModes {
		Save = 1,
		Restore = 2,
		PerformanceModeValidate = 3
	}

	export class Core {
		constructor(private _Options: Options) {
			this._InitializeExtender();
		}
		get_Options() {
			return this._Options;
		}

		static groupHeaderRowSelector = "tr.rgGroupHeader";
		static groupHeaderCellElementSelector = "td.rgGroupCol";
		static groupHeaderCellToggleElementName = "INPUT";
		static groupExpandCollapseInputElementClass_Expand = "rgExpand";
		static groupExpandCollapseInputElementClass_Collapse = "rgCollapse";

		static groupingSettings_GroupByFieldsSeparator: string;

		private _InitializeExtender() {
			var grid = this.get_Grid();
			Core.groupingSettings_GroupByFieldsSeparator = (<any>grid)._groupingSettings.GroupByFieldsSeparator;

			if (this._Options.clientDataSource_AddEventHandlers) {
				this._InitializeExtender_ClientSideData();
			} else if (this._Options.ajaxRefresh_AddEventHandlers) {
				this._InitializeExtender_AjaxRefresh();
			}
		}

		//#region AJAX Refresh Event Handlers
		private _InitializeExtender_AjaxRefresh() {
			var prmInstance = Sys.WebForms.PageRequestManager.getInstance();
			if (!prmInstance) { return; }
			prmInstance.add_beginRequest((sender, args) => this._PageRequestManager_BeginRequest(sender, args));
			prmInstance.add_endRequest((sender, args) => this._PageRequestManager_EndRequest(sender, args));
		}
		private _PageRequestManager_BeginRequest(sender, args: Sys.WebForms.BeginRequestEventArgs) {
			this.SaveGrouping();
		}
		private _PageRequestManager_EndRequest(sender, args: Sys.WebForms.EndRequestEventArgs) {
			this.RestoreGrouping();
		}
		//#endregion

		//#region Client Data Source Event Handlers
		private _InitializeExtender_ClientSideData() {
			var grid = this.get_Grid();
			grid.add_command((sender, args) => this._Grid_OnCommand(sender, args));
			grid.add_dataBound((sender, args) => this._Grid_OnDataBound(sender, args));
		}
		private _Grid_OnCommand(sender, args: Telerik.Web.UI.GridCommandEventArgs) {
			this.SaveGrouping();
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
				var containerElement: JQuery;
				if (this._Options.gridContainerSelector) {
					containerElement = $(this._Options.gridContainerSelector);
				} else {
					containerElement = this.get_$GridDataElement();
				}
				if (containerElement.length === 1) {
					this._containerScrollTop = containerElement.get(0).scrollTop;
				} else {
					if (console && typeof console.log === "function") {
						console.log("RadGrid Group State Preservation: Scroll container not found.  Enable grid scrolling or specify a container selector in Options.");
					}
				}
			}
		}
		private _scrollPosition_Restore() {
			if (this.get_Options().saveGridScrollPosition) {
				var containerElement: JQuery;
				if (this._Options.gridContainerSelector) {
					containerElement = $(this._Options.gridContainerSelector);
				} else {
					containerElement = this.get_$GridDataElement();
				}
				if (containerElement.length === 1) {
					containerElement.get(0).scrollTop = this._containerScrollTop;
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
		private _currentNestLevel: number;
		private _currentTopLevelGroupName: string = null;
		private _currentParentGroupPathArray: Array<string>;
		private _beginSaveRestore() {
			this._currentNestLevel = 0;
			this._currentParentGroupPathArray = [];
		}
		private _getCurrentParentGroupPath(): string {
			if (this._currentParentGroupPathArray.length === 0) { return ""; }
			return this._currentParentGroupPathArray.join("/");
		}
		private _SaveRestoreGroupingHeaderRowLoop(
			Mode: SaveRestoreModes, elementIndex: number, groupRowElement: Element): void {
			var $groupRowElement = $(groupRowElement);
			var $groupHeaderCellElementsForCurrentRow =
				$groupRowElement.find(Core.groupHeaderCellElementSelector);

			this._headerRowGroupProcessing($groupRowElement, $groupHeaderCellElementsForCurrentRow);

			switch (Mode) {
				case SaveRestoreModes.Save:
					$groupHeaderCellElementsForCurrentRow.each(
						(elementIndex, groupCellElement) =>
							this._saveGroupingHeaderCellLoop(Mode, elementIndex, groupCellElement));
					break;
				case SaveRestoreModes.Restore:
					$groupHeaderCellElementsForCurrentRow.each(
						(elementIndex, groupCellElement) =>
							this._restoreGroupingHeaderCellLoop(elementIndex, groupCellElement));
					break;
				case SaveRestoreModes.PerformanceModeValidate:
					$groupHeaderCellElementsForCurrentRow.each(
						(elementIndex, groupCellElement) =>
							this._saveGroupingHeaderCellLoop(Mode, elementIndex, groupCellElement));
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
		private _headerRowGroupProcessing($groupRowElement: JQuery, $groupHeaderCellElementsForCurrentRow: JQuery): void {
			var nestLevel = 0;
			var thisClass = this;
			var groupText = "";
			$groupHeaderCellElementsForCurrentRow.each(
				function (elementIndex, groupCellElement) {
					groupText = thisClass._get_GroupText(<HTMLTableCellElement>groupCellElement);
					if (!groupText) {
						nestLevel += 1;
						groupText = "";
					}
				});
			if (nestLevel !== this._currentNestLevel) {
				var nestLevelChange: number = this._currentNestLevel - nestLevel;
				if (nestLevel === 0) {
					this._currentParentGroupPathArray = [];
				} else if (nestLevel < this._currentNestLevel) {
					for (var i = 0; i < nestLevelChange; i++) {
						this._currentParentGroupPathArray.pop();
					}
				} else if (nestLevel > this._currentNestLevel) {
					this._currentParentGroupPathArray.push(this._get_GroupTextByGroupRowElement($groupRowElement.prev()));
				}
			}
			this._currentNestLevel = nestLevel;

			this._trackTopLevelGroupChanges(nestLevel, groupText);
		}
		private _get_$GroupHeaderRowElements(): JQuery {
			var masterTableView = this.get_GridMasterTableView();
			if (!masterTableView) { return null; }

			return $(masterTableView.get_element()).
				find(Core.groupHeaderRowSelector);
		}
		private _get_GroupState(groupHeaderTDElement: HTMLTableCellElement, elementIndex: number): GroupState {
			var tdElement_FirstChild = <HTMLElement>(groupHeaderTDElement.firstChild);
			if (tdElement_FirstChild !== null
				&& tdElement_FirstChild.tagName === Core.groupHeaderCellToggleElementName) {
				var $tdElement_FirstChild = $(tdElement_FirstChild);
				if ($tdElement_FirstChild.hasClass(Core.groupExpandCollapseInputElementClass_Expand)
					|| $tdElement_FirstChild.hasClass(Core.groupExpandCollapseInputElementClass_Collapse)) {
					var IsExpanded: boolean = $tdElement_FirstChild.hasClass(Core.groupExpandCollapseInputElementClass_Collapse);
					var GroupText = this._get_GroupText(groupHeaderTDElement);
					if (GroupText) {
						return new GroupState(
							GroupText,
							this._getCurrentParentGroupPath(),
							IsExpanded,
							(<HTMLInputElement>(groupHeaderTDElement.firstChild)));
					}
				}
			}
			return null;
		}
		private _get_GroupTextByGroupRowElement($groupRowElement: JQuery) {
			var $groupHeaderCellElementsForCurrentRow =
				$groupRowElement.find(Core.groupHeaderCellElementSelector);
			var groupText = null;
			var thisClass = this;
			$groupHeaderCellElementsForCurrentRow.each(
				function (elementIndex, groupCellElement) {
					groupText = thisClass._get_GroupText(<HTMLTableCellElement>groupCellElement);
					if (!groupText) {
						groupText = "";
					} else { return false; }
				});

			return groupText;
		}
		private _get_GroupText(groupHeaderTDElement: HTMLTableCellElement) {
			var tdElement_NextSibling = <HTMLElement>(groupHeaderTDElement.nextSibling);
			if (tdElement_NextSibling !== null) {
				var GroupText = tdElement_NextSibling.innerText;

				if (this._Options.groupByExpressionAggregates_AutoStrip) {
					var groupByExpressionsProcessed = false;
					if (this._Options.groupByExpressionAggregates_SecondDisplayName
						&& GroupText.indexOf(this._Options.groupByExpressionAggregates_SecondDisplayName) > -1) {
						GroupText = GroupText.substring(
							0, GroupText.indexOf(
								Core.groupingSettings_GroupByFieldsSeparator
								+ this._Options.groupByExpressionAggregates_SecondDisplayName));
						groupByExpressionsProcessed = true;
					}
					if ((!groupByExpressionsProcessed)
						&& GroupText.indexOf(Core.groupingSettings_GroupByFieldsSeparator) > - 1) {
						//GroupByExpression (Aggregates) are likely present but not identified explicitly, so strip manually.
						GroupText = GroupText.substring(
							0, GroupText.indexOf(Core.groupingSettings_GroupByFieldsSeparator));
					}
				}
				var finalGroupText = GroupText.trim();
				if (finalGroupText === "") {
					return null;
				}
				return finalGroupText;
			}
			return null;
		}
		//#endregion

		//#region Save
		private _saveGroupingHeaderCellLoop(Mode: SaveRestoreModes, elementIndex: number, groupCellElement: Element) {
			var groupState = this._get_GroupState(
				<HTMLTableCellElement>groupCellElement,
				elementIndex);

			if (groupState) {
				if (groupState.IsExpanded) {
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
		private _restoreGroupingHeaderCellLoop(elementIndex: number, groupCellElement: Element) {
			var groupState = this._get_GroupState(
				<HTMLTableCellElement>groupCellElement,
				elementIndex);
			if (groupState) {
				if (groupState.IsExpanded
					&& this._groupsCollapsed.indexOf(groupState.FullGroupText()) !== -1) {
					groupState.ExpandCollapseButtonElement.click();
				} else if (!groupState.IsExpanded
					&& this._groupsExpanded.indexOf(groupState.FullGroupText()) !== -1) {
					groupState.ExpandCollapseButtonElement.click();
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

			var $groupHeaderRowElements = this._get_$GroupHeaderRowElements();
			if (!$groupHeaderRowElements) { return; }

			$groupHeaderRowElements.each(
				(elementIndex, groupRowElement) =>
					thisClass._SaveRestoreGroupingHeaderRowLoop(
						SaveRestoreModes.Save, elementIndex, groupRowElement));
		}
		RestoreGrouping() {
			if (this._groupsExpanded.length === 0 && this._groupsCollapsed.length === 0) { return; }

			var thisClass = this;
			this._beginSaveRestore();

			var $groupHeaderRowElements = this._get_$GroupHeaderRowElements();
			if (!$groupHeaderRowElements) { return; }

			$groupHeaderRowElements.each(
				(elementIndex, groupRowElement) =>
					thisClass._SaveRestoreGroupingHeaderRowLoop(
						SaveRestoreModes.Restore, elementIndex, groupRowElement));

			this._scrollPosition_Restore();
		}
		ResetGrouping() {
			this._groupsExpanded = [];
			this._groupsCollapsed = [];
		}
		//#endregion
	}
}

//#region Implementation Example
var Grid_GroupStatePreservation: ClApps_Common.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.Core;
function ApplicationLoaded(args): void {
	Sys.Application.remove_load(appLoadedHandler);
	var GroupStatePreservation_Options = new ClApps_Common.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.Options(
		"RadGrid1", true, "Random Number Sum");
	GroupStatePreservation_Options.saveGridScrollPosition = true;
	GroupStatePreservation_Options.ajaxRefresh_AddEventHandlers = true;
	Grid_GroupStatePreservation = new ClApps_Common.Extenders.TelerikCustom.RadGrid.GroupStatePreservation.Core(
		GroupStatePreservation_Options);
}
var appLoadedHandler = (args) => ApplicationLoaded(args);
Sys.Application.add_load(appLoadedHandler);

//Note: the following $(document).ready(...) method does not ensure that all ASP.Net controls are loaded (Sys.Application.load event is required only for ASP.Net AJAX).
//	Kendo UI can use this method, however; just call ApplicationLoaded() after you've initialized your Kendo UI grid.
//$telerik.$(document).ready(function () {
//	ApplicationLoaded();
//});

//** If you wanted to control when group states are saved/restored, this is one way to do it:
function RadAjaxManager1_requestStart(sender, eventArgs): void {
	//Grid_GroupStatePreservation.SaveGrouping();
}
function RadAjaxManager1_responseEnd(sender, eventArgs): void {
	//Grid_GroupStatePreservation.RestoreGrouping();
}
//#endregion