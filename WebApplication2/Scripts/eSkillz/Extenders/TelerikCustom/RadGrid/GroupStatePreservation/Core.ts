/// <reference path="../../gridcommon/groupstatepreservation/core.ts" />

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

		constructor(private options: Options) {
			this._Initialize();
		}
		get_Options() {
			return this.options;
		}

		static GroupingSettings_GroupByFieldsSeparator: string;
		private _commonGroupState: eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.Core;
		private _Initialize() {
			if (!this.options.RefreshMode) {
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
			this._InitializeStateTrackingMode();
		}

		GetGroupDataByRow($groupHeaderElement: JQuery):
			eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.IGroupData {
			switch (this.options.RefreshMode) {
				case RefreshModes.ClientDataSource:
					var grid = this.get_Grid(),
						masterTableView = <Telerik.Web.UI.GridTableViewInternal>(grid.get_masterTableView()),
						kendoDataSourceWidget = (<Telerik.Web.UI.RadClientDataSource_Corrected>$find(
							(<Telerik.Web.UI.RadGridInternal>grid)._clientDataSourceID)).get_kendoWidget();

					var groupLevel = $groupHeaderElement.children(".rgGroupCol").length,
						groups = kendoDataSourceWidget.group(),
						fieldName = groups[groupLevel - 1].field;

					var nextDataRow = $groupHeaderElement.nextUntil("tr.rgRow,tr.rgAltRow").last().next();
					nextDataRow = (nextDataRow.length === 1 ? nextDataRow : $groupHeaderElement.next());

					var dataItems = masterTableView.get_dataItems();
					var fieldValue: any, nextDataRowElement = nextDataRow.get(0);
					if (nextDataRow.length === 1) {
						for (var i = 0, itemCount = dataItems.length; i < itemCount; i++) {
							var dataItem = dataItems[i];
							if (dataItem.get_element() === nextDataRowElement) {
								fieldValue = dataItem.get_dataItem()[fieldName];
								break;
							}
						}
					}
					if (typeof fieldValue === "undefined") {
						return null;
					}

					return {
						key: groupLevel.toString() + fieldName + fieldValue,
						level: groupLevel,
						fieldName: fieldName
					};
				case RefreshModes.AJAX:
					var groupDataString = $groupHeaderElement.attr("data-gdata");

					if (!groupDataString || groupDataString === "") {
						if (console && typeof console.log === "function") {
							console.log("Error, group data attribute [data-gdata] is missing.");
						}
						return null;
					}
					var groupData = JSON.parse<WebApplication2.Extenders.TelerikCustom.RadGrid.Helpers.GroupData>(groupDataString);

					if (!groupData || typeof groupData.FieldValue === "undefined") {
						return null;
					}

					return {
						key: groupData.GroupLevel.toString() + groupData.FieldName + groupData.FieldValue,
						level: groupData.GroupLevel,
						fieldName: groupData.FieldName
					};
			}
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
		private gridGroupStateChangedHandler: (
			sender: Telerik.Web.UI.RadGrid_Corrected, args: Telerik.Web.UI.GridGroupCollapsingEventArgs) => void;
		private _addGroupStateChangeEventHandlers() {
			var grid = this.get_Grid();
			this.gridGroupStateChangedHandler = (sender, args) => {
				if (this._commonGroupState.get_pauseGroupStateChangeEventHandlers()) { return; }
				this.SaveGroupStateAsync();
			};
			grid.add_groupExpanded(this.gridGroupStateChangedHandler);
			grid.add_groupCollapsed(this.gridGroupStateChangedHandler);
		}
		private _removeGroupStateChangeEventHandlers() {
			var grid = this.get_Grid();
			grid.remove_groupExpanded(this.gridGroupStateChangedHandler);
			grid.remove_groupCollapsed(this.gridGroupStateChangedHandler);
		}
		//#endregion

		private _InitializeStateTrackingMode(): void {
			switch (this.options.RefreshMode) {
				case RefreshModes.ClientDataSource:
					var grid = this.get_Grid();
					grid.add_dataBinding((sender, args) => { this.SaveGroupStateFinishCheck(); });
					grid.add_dataBound((sender, args) => { this.RestoreGroupState(); });
					break;
				case RefreshModes.AJAX:
					var prmInstance = Sys.WebForms.PageRequestManager.getInstance();
					if (!prmInstance) {
						if (console && typeof console.log === "function") {
							console.log("Error, Options.RefreshMode was set to AJAX, but there is no PageRequestManager.");
						}
						return;
					}
					prmInstance.add_beginRequest((sender, args) => {
						this._removeGroupStateChangeEventHandlers();
						this.SaveGroupStateFinishCheck();
					});
					prmInstance.add_endRequest((sender, args) => {
						this.RestoreGroupState();
						this._addGroupStateChangeEventHandlers();
					});
					break;
			}
		}

		get_Grid() {
			return <Telerik.Web.UI.RadGrid_Corrected>($find(this.options.gridClientID));
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
			var gridDataElement = $("#" + this.options.gridClientID + "_GridData");
			if (gridDataElement.length === 1) {
				return gridDataElement;
			}
			return null;
		}
		private _scrollPosition_Save() {
			if (this.get_Options().saveGridScrollPosition) {
				var $containerElement: JQuery;
				if (this.options.gridContainerSelector) {
					$containerElement = $(this.options.gridContainerSelector);
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
				if (this.options.gridContainerSelector) {
					$containerElement = $(this.options.gridContainerSelector);
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

		SaveGroupStateAsync(): void {
			this._scrollPosition_Save();
			this._commonGroupState.SaveGroupStateAsync(this._get_$MasterTableViewElement());
		}
		SaveGroupStateFinishCheck(forceSave = false): void {
			this._scrollPosition_Save();
			this._commonGroupState.SaveGroupStateFinishCheck(this._get_$MasterTableViewElement(), forceSave);
		}
		private _restoreInProgress_GridView: Telerik.Web.UI.GridTableView = null;
		RestoreGroupState(
			defaultGroupToggleAction =
				eSkillz.Extenders.TelerikCustom.GridCommon.GroupStatePreservation.GroupToggleActions.None): void {
			this._restoreInProgress_GridView = this.get_GridMasterTableView();
			this._commonGroupState.RestoreGroupState(this._get_$MasterTableViewElement(), defaultGroupToggleAction);
			setTimeout(() => this._scrollPosition_Restore(), 0);
			this._restoreInProgress_GridView = null;
		}
		ResetGroupState(): void {
			this._commonGroupState.ResetGroupState();
		}
	}
}