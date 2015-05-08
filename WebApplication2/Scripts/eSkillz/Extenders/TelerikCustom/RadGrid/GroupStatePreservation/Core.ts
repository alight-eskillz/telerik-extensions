﻿/// <reference path="../../gridcommon/groupstatepreservation/core.ts" />

module eSkillz.Extenders.TelerikCustom.RadGrid.GroupStatePreservation {
	export enum RefreshModes {
		ClientDataSource = 1,
		AJAX = 2
	}
	export class Options {
		constructor(
			public gridClientID: string,
			public RefreshMode: RefreshModes = null,
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
					($groupHeaderElement) => this.GetGroupDataByRow($groupHeaderElement)
				//,($groupHeaderElement, toggleAction) =>
				//this.ToggleGroupByRow($groupHeaderElement, toggleAction)
					));

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

		GetGroupDataByRow($groupHeaderElement: JQuery):
			eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.IGroupData {
			var dataSpan = $groupHeaderElement.find("span[data-gdata]"),
				groupData: WebApplication2.Extenders.TelerikCustom.RadGrid.Helpers.IGroupData;

			if (dataSpan.length === 0) {
				if (console && typeof console.log === "function") {
					console.log("Error, group data attribute [data-gdata] is missing.");
				}
				return null;
			}
			groupData = JSON.parse(dataSpan.attr("data-gdata"));

			return {
				key: groupData.groupLevel.toString() + groupData.fieldName + groupData.fieldValue,
				level: groupData.groupLevel,
				fieldName: groupData.fieldName
			};
		}
		ToggleGroupByRow($groupHeaderElement: JQuery,
			toggleAction: eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions): void {
			//TODO: This code does not seem to work...check with Telerik

			//var view = this.get_GridMasterTableView();
			//switch (toggleAction) {
			//	case eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions.Expand:
			//		view.expandGroup($groupHeaderElement.get(0));
			//		break;
			//	case eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions.Collapse:
			//		view.collapseGroup($groupHeaderElement.get(0));
			//		break;
			//}
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
		private _Grid_OnDataBound(sender: Telerik.Web.UI.RadGrid, args) {
			this.RestoreGrouping();
		}
		//#endregion

		get_Grid() {
			return <Telerik.Web.UI.RadGrid>($find(this._Options.gridClientID));
		}
		get_GridMasterTableView(grid?: Telerik.Web.UI.RadGrid): Telerik.Web.UI.GridTableView {
			if (this._restoreInProgress_GridView) {
				return this._restoreInProgress_GridView;
			} else {
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
		private _scrollPosition_Save() {
			if (this.get_Options().saveGridScrollPosition) {
				var $containerElement: JQuery;
				if (this._Options.gridContainerSelector) {
					$containerElement = $(this._Options.gridContainerSelector);
				} else {
					$containerElement = this.get_$GridDataElement();
				}
				var masterTableView = this.get_GridMasterTableView();
				if (masterTableView) {
					this._commonGroupState.SaveScrollPosition(
						$containerElement, masterTableView.get_currentPageIndex());
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
				var masterTableView = this.get_GridMasterTableView();
				if (masterTableView) {
					this._commonGroupState.RestoreScrollPosition(
						$containerElement, masterTableView.get_currentPageIndex());
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
		private _restoreInProgress_GridView: Telerik.Web.UI.GridTableView = null;
		RestoreGrouping(
			defaultGroupToggleAction =
			eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions.None): void {
			this._restoreInProgress_GridView = this.get_GridMasterTableView();
			this._commonGroupState.RestoreGrouping(this._get_$MasterTableViewElement(), defaultGroupToggleAction);
			setTimeout(() => this._scrollPosition_Restore(), 0);
			this._restoreInProgress_GridView = null;
		}
		ResetGrouping(): void {
			this._commonGroupState.ResetGrouping();
		}
	}
}