/// <reference path="../../gridcommon/groupstatepreservation/core.ts" />

module eSkillz.Extenders.TelerikCustom.ASPNetGrid.GroupStatePreservation {
	export enum RefreshModes {
		ClientDataSource = 1,
		AJAX = 2
	}
	export class Options
		implements eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.IImplementationOptions {
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
	export class Core
		implements eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.IImplementation {

		constructor(private _Options: Options) {
			this._Initialize();
		}
		get_Options() {
			return this._Options;
		}

		static GroupingSettings_GroupByFieldsSeparator: string;
		private _commonGroupState: eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.Core;
		private _Initialize() {
			if (!this._Options.RefreshMode) {
				if (console && typeof console.log === "function") {
					console.log("Error, must specify Options.RefreshMode.");
				}
				return;
			}

			var grid = this.get_Grid();

			var gridInternalProperties: TelerikInternalProps.Web.UI.RadGrid = (<any>grid);
			var GroupingSettings_GroupByFieldsSeparator = ";";
			if (gridInternalProperties._groupingSettings) {
				GroupingSettings_GroupByFieldsSeparator = gridInternalProperties._groupingSettings.GroupByFieldsSeparator;
			}

			this._commonGroupState =
			new eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.Core(
				new eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.Options(
					"tr.rgGroupHeader",
					"td button",
					":last",
					"td",
					":last",
					"rgExpand",
					"rgCollapse",
					GroupingSettings_GroupByFieldsSeparator,
					this._Options));

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
			if (this._commonGroupState.get_pauseGroupStateChangeEventHandlers()) { return; }
			this.SaveGroupingAsync();
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
			this.FinishSaveGroupingCheck();
		}
		private _PageRequestManager_EndRequest(sender, args: Sys.WebForms.EndRequestEventArgs) {
			this.RestoreGrouping();
			this._addGroupStateChangeEventHandlers();
		}
		//#endregion

		//#region Client Data Source Event Handlers
		private _InitializeStateTrackingModes_ClientSideData() {
			var grid = this.get_Grid();
			grid.add_dataBinding((sender, args) => this._Grid_OnDataBinding(sender, args));
			grid.add_dataBound((sender, args) => this._Grid_OnDataBound(sender, args));
		}
		private _Grid_OnDataBinding(sender, args) {
			this.FinishSaveGroupingCheck();
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
		private _gridCurrentPageIndex: number = 0;
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

					var masterTableView = this.get_GridMasterTableView();
					if (masterTableView) {
						this._gridCurrentPageIndex = masterTableView.get_currentPageIndex();
					}
				} else {
					if (console && typeof console.log === "function") {
						console.log("Grid Group State Preservation: Scroll container not found.  Enable grid scrolling or specify a container selector in Options.");
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
					var masterTableView = this.get_GridMasterTableView();
					if (masterTableView && this._gridCurrentPageIndex === masterTableView.get_currentPageIndex()) {
						$containerElement.get(0).scrollTop = this._containerScrollTop;
					}
				} else {
					if (console && typeof console.log === "function") {
						console.log("Grid Group State Preservation: Scroll container not found.  Enable grid scrolling or specify a container selector in Options.");
					}
				}
			}
		}
		//#endregion

		private _get_$MasterTableViewElement(): JQuery {
			var masterTableView = this.get_GridMasterTableView();
			if (!masterTableView) { return null; }

			return $(masterTableView.get_element());
		}

		SaveGroupingAsync(): void {
			this._scrollPosition_Save();
			this._commonGroupState.SaveGroupingAsync(this._get_$MasterTableViewElement());
		}
		FinishSaveGroupingCheck(forceSave = false): void {
			this._scrollPosition_Save();
			this._commonGroupState.FinishSaveGroupingCheck(this._get_$MasterTableViewElement(), forceSave);
		}
		RestoreGrouping(): void {
			this._commonGroupState.RestoreGrouping(this._get_$MasterTableViewElement());
			this._scrollPosition_Restore();
		}
		ResetGrouping(): void {
			this._commonGroupState.ResetGrouping();
			this._containerScrollTop = 0;
		}
	}
}